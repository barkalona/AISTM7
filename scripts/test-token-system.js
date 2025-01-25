const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { Token } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TokenSystemMonitor = require('./monitor-token-system');
const { deployTokenSystem, verifyDeployment } = require('./deploy-token-system');

async function runTokenSystemTests() {
    console.log('Starting token system tests...');
    
    let monitor;
    try {
        // Step 1: Deploy the system
        console.log('\n1. Deploying token system...');
        const deploymentInfo = await deployTokenSystem();
        await verifyDeployment(deploymentInfo);
        console.log('✓ Deployment successful');

        // Step 2: Initialize monitoring
        console.log('\n2. Initializing monitoring...');
        monitor = new TokenSystemMonitor();
        await monitor.start();
        console.log('✓ Monitoring initialized');

        // Step 3: Test price monitoring
        console.log('\n3. Testing price monitoring...');
        await testPriceMonitoring(monitor);
        console.log('✓ Price monitoring working');

        // Step 4: Test requirement adjustments
        console.log('\n4. Testing requirement adjustments...');
        await testRequirementAdjustments(monitor);
        console.log('✓ Requirement adjustments working');

        // Step 5: Test balance verification
        console.log('\n5. Testing balance verification...');
        await testBalanceVerification(deploymentInfo);
        console.log('✓ Balance verification working');

        // Step 6: Test system recovery
        console.log('\n6. Testing system recovery...');
        await testSystemRecovery(monitor);
        console.log('✓ System recovery working');

        console.log('\nAll tests completed successfully!');
    } catch (error) {
        console.error('\nTest suite failed:', error);
        throw error;
    } finally {
        if (monitor) {
            await monitor.stop();
        }
    }
}

async function testPriceMonitoring(monitor) {
    // Test 1: Get current price
    const initialMetrics = await monitor.getSystemMetrics();
    if (!initialMetrics.currentPrice) {
        throw new Error('Failed to get current price');
    }

    // Test 2: Price history
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for price update
    const priceHistory = await monitor.tokenPriceService.getPriceHistory('1h');
    if (!priceHistory.length) {
        throw new Error('No price history recorded');
    }

    // Test 3: Price change calculation
    const metrics = await monitor.tokenPriceService.getTokenMetrics();
    if (typeof metrics.priceChange24h !== 'number') {
        throw new Error('Price change calculation failed');
    }

    return true;
}

async function testRequirementAdjustments(monitor) {
    // Test 1: Get initial requirement
    const initialRequirement = await monitor.balanceRequirementService.getCurrentRequirement();
    
    // Test 2: Force requirement update
    await monitor.balanceRequirementService.updateRequirement();
    
    // Test 3: Verify requirement history
    const history = await monitor.getRequirementHistory(1);
    if (!history.length) {
        throw new Error('No requirement history recorded');
    }

    // Test 4: Verify USD value maintenance
    const metrics = await monitor.getSystemMetrics();
    const currentUsdValue = metrics.currentPrice * metrics.currentRequirement;
    const targetDifference = Math.abs(currentUsdValue - metrics.targetUsdValue) / metrics.targetUsdValue;
    
    if (targetDifference > 0.02) { // Allow 2% deviation
        throw new Error('USD value maintenance failed');
    }

    return true;
}

async function testBalanceVerification(deploymentInfo) {
    const connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed');
    const balanceRequirementService = require('../backend/services/balanceRequirementService');
    
    // Create test wallet
    const testWallet = Keypair.generate();
    
    // Test 1: Verify zero balance
    const zeroBalance = await balanceRequirementService.verifyBalance(testWallet.publicKey.toString());
    if (zeroBalance.hasRequiredBalance) {
        throw new Error('Zero balance verification failed');
    }

    // Test 2: Create token account and mint tokens
    const mint = new Token(
        connection,
        new PublicKey(deploymentInfo.mintAddress),
        Token.PROGRAM_ID,
        testWallet
    );

    const tokenAccount = await mint.createAccount(testWallet.publicKey);
    await mint.mintTo(
        tokenAccount,
        deploymentInfo.mintAuthority,
        [],
        1000000 // Test amount
    );

    // Test 3: Verify sufficient balance
    const sufficientBalance = await balanceRequirementService.verifyBalance(testWallet.publicKey.toString());
    if (!sufficientBalance.hasRequiredBalance) {
        throw new Error('Sufficient balance verification failed');
    }

    return true;
}

async function testSystemRecovery(monitor) {
    // Test 1: Simulate price service failure
    monitor.tokenPriceService.stopPriceMonitoring();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Verify automatic recovery
    const healthCheck = await monitor.performHealthCheck();
    if (!healthCheck.priceService) {
        throw new Error('Price service recovery failed');
    }

    // Test 3: Verify system stability
    const metrics = await monitor.getSystemMetrics();
    if (!metrics.currentPrice || !metrics.currentRequirement) {
        throw new Error('System stability verification failed');
    }

    return true;
}

// Execute if run directly
if (require.main === module) {
    runTokenSystemTests()
        .then(() => {
            console.log('Test suite completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = {
    runTokenSystemTests,
    testPriceMonitoring,
    testRequirementAdjustments,
    testBalanceVerification,
    testSystemRecovery
};