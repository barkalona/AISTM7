import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { assert } from "chai";
import { Aistm7Token } from "../target/types/aistm7_token";

describe("AISTM7 Token", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Aistm7Token as Program<Aistm7Token>;
  const authority = Keypair.generate();
  let mint: PublicKey;
  let authorityTokenAccount: PublicKey;
  let tokenState: PublicKey;
  
  const TARGET_USD_VALUE = new anchor.BN(20); // $20 USD
  const INITIAL_SUPPLY = new anchor.BN(1_000_000_000); // 1 billion tokens

  before(async () => {
    // Airdrop SOL to authority
    const signature = await provider.connection.requestAirdrop(
      authority.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);
  });

  it("Initializes the token program", async () => {
    // Create mint
    mint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      authority.publicKey,
      9 // 9 decimals like SOL
    );

    // Create authority's token account
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      authority,
      mint,
      authority.publicKey
    );
    authorityTokenAccount = tokenAccount.address;

    // Find PDA for token state
    [tokenState] = await PublicKey.findProgramAddress(
      [Buffer.from("token_state")],
      program.programId
    );

    // Initialize token program
    await program.methods
      .initialize(INITIAL_SUPPLY, TARGET_USD_VALUE)
      .accounts({
        authority: authority.publicKey,
        state: tokenState,
        mint,
        authorityTokenAccount,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([authority])
      .rpc();

    // Verify initialization
    const state = await program.account.tokenState.fetch(tokenState);
    assert.ok(state.authority.equals(authority.publicKey));
    assert.ok(state.mint.equals(mint));
    assert.equal(state.targetUsdValue.toNumber(), TARGET_USD_VALUE.toNumber());
    assert.equal(state.currentRequirement.toNumber(), 700_000);
  });

  it("Updates balance requirement based on price", async () => {
    // Mock Pyth price feed for testing
    const mockPriceFeed = Keypair.generate();
    await provider.connection.requestAirdrop(
      mockPriceFeed.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );

    // Update balance requirement
    await program.methods
      .updateBalanceRequirement(mockPriceFeed.publicKey)
      .accounts({
        authority: authority.publicKey,
        state: tokenState,
        priceFeed: mockPriceFeed.publicKey,
      })
      .signers([authority])
      .rpc();

    // Verify the update
    const state = await program.account.tokenState.fetch(tokenState);
    assert.isTrue(state.lastUpdate > 0);
  });

  it("Verifies token balance meets requirement", async () => {
    // Create a test user
    const user = Keypair.generate();
    await provider.connection.requestAirdrop(
      user.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );

    // Create user's token account
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user,
      mint,
      user.publicKey
    );

    // Check balance requirement
    const hasAccess = await program.methods
      .verifyBalance()
      .accounts({
        state: tokenState,
        tokenAccount: userTokenAccount.address,
      })
      .view();

    // Should be false since user has no tokens
    assert.isFalse(hasAccess);
  });
});