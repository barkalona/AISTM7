use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use pyth_sdk_solana::load_price_feed_from_account_info;

declare_id!("AISTM7TokenProgramID11111111111111111111111111111111");

#[program]
pub mod aistm7_token {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        initial_supply: u64,
    ) -> Result<()> {
        let mint_info = &ctx.accounts.mint;
        let mint = &mut ctx.accounts.mint;
        let token_program = &ctx.accounts.token_program;
        let authority = &ctx.accounts.authority;
        
        // Initialize mint with authority
        token::initialize_mint(
            CpiContext::new(
                token_program.to_account_info(),
                token::InitializeMint {
                    mint: mint_info.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
            ),
            9, // 9 decimals like SOL
            authority.key,
            Some(authority.key),
        )?;

        // Set initial parameters
        let state = &mut ctx.accounts.state;
        state.authority = authority.key();
        state.mint = mint.key();
        state.target_usd_value = 15_000_000; // $15 USD in millionths
        state.min_tokens = 100; // Minimum 100 tokens regardless of price
        state.max_tokens = 10_000; // Maximum 10,000 tokens regardless of price
        state.current_requirement = 750; // Initial requirement (at $0.02 per token)
        
        // Mint initial supply to authority
        token::mint_to(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                token::MintTo {
                    mint: mint.to_account_info(),
                    to: ctx.accounts.authority_token_account.to_account_info(),
                    authority: authority.to_account_info(),
                },
                &[],
            ),
            initial_supply,
        )?;

        Ok(())
    }

    pub fn update_balance_requirement(
        ctx: Context<UpdateBalanceRequirement>,
        price_feed: Pubkey,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let price_feed_acc = &ctx.accounts.price_feed;
        
        // Get current price from Pyth (in USD with 6 decimals)
        let price_feed = load_price_feed_from_account_info(price_feed_acc)?;
        let current_price = price_feed.get_current_price()
            .ok_or(ErrorCode::NoPriceFound)?
            .price as u64;
        
        // Calculate new requirement based on $15 USD target
        // target_usd_value is in millionths of USD (e.g., 15_000_000 for $15)
        // current_price is in millionths of USD per token
        let new_requirement = state.target_usd_value
            .checked_div(current_price)
            .ok_or(ErrorCode::MathOverflow)?;
        
        // Apply min/max bounds
        let new_requirement = std::cmp::max(
            state.min_tokens,
            std::cmp::min(state.max_tokens, new_requirement),
        );
        
        // Update only if change is significant (>1%)
        let requirement_change = if state.current_requirement > 0 {
            ((new_requirement as i128 - state.current_requirement as i128) * 100)
                .checked_div(state.current_requirement as i128)
                .unwrap_or(100)
        } else {
            100
        };
        
        if requirement_change.abs() >= 1 {
            state.current_requirement = new_requirement;
            state.last_update = Clock::get()?.unix_timestamp;
            emit!(BalanceRequirementUpdated {
                new_requirement,
                price: current_price,
                timestamp: state.last_update,
            });
        }
        
        Ok(())
    }

    pub fn verify_balance(ctx: Context<VerifyBalance>) -> Result<bool> {
        let state = &ctx.accounts.state;
        let token_account = &ctx.accounts.token_account;
        
        Ok(token_account.amount >= state.current_requirement)
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + TokenState::LEN,
        seeds = [b"token_state"],
        bump
    )]
    pub state: Account<'info, TokenState>,
    
    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = authority,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub authority_token_account: Account<'info, TokenAccount>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateBalanceRequirement<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"token_state"],
        bump,
        has_one = authority,
    )]
    pub state: Account<'info, TokenState>,
    
    /// CHECK: Verified in instruction logic
    pub price_feed: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct VerifyBalance<'info> {
    #[account(seeds = [b"token_state"], bump)]
    pub state: Account<'info, TokenState>,
    
    #[account(constraint = token_account.mint == state.mint)]
    pub token_account: Account<'info, TokenAccount>,
}

#[account]
pub struct TokenState {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub target_usd_value: u64,
    pub min_tokens: u64,
    pub max_tokens: u64,
    pub current_requirement: u64,
    pub last_update: i64,
}

impl TokenState {
    pub const LEN: usize = 32 + 32 + 8 + 8 + 8 + 8 + 8;
}

#[event]
pub struct BalanceRequirementUpdated {
    pub new_requirement: u64,
    pub price: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("No price found in Pyth price feed")]
    NoPriceFound,
    #[msg("Math operation overflow")]
    MathOverflow,
}