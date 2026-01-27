#[test_only]
module profile_nft::profile_nft_tests;

use profile_nft::profile_nft::{Self, ProfileNFT, PaymentConfig};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::test_scenario::{Self as ts, Scenario};

// Test addresses
const ADMIN: address = @0xAD;
const USER1: address = @0x1;
const USER2: address = @0x2;

// Test constants
const PAYMENT_AMOUNT: u64 = 10_000_000; // 0.01 SUI

// ===== Helper Functions =====

fun init_test_scenario(): Scenario {
    let mut scenario = ts::begin(ADMIN);
    {
        profile_nft::init_for_testing(ts::ctx(&mut scenario));
    };
    scenario
}

fun mint_sui(scenario: &mut Scenario, recipient: address, amount: u64) {
    ts::next_tx(scenario, ADMIN);
    {
        let coin = coin::mint_for_testing<SUI>(amount, ts::ctx(scenario));
        transfer::public_transfer(coin, recipient);
    };
}

// ===== Initialization Tests =====

#[test]
fun test_init_creates_payment_config() {
    let mut scenario = init_test_scenario();

    // Check that PaymentConfig was created
    ts::next_tx(&mut scenario, ADMIN);
    {
        let config = ts::take_shared<PaymentConfig>(&scenario);

        // Verify initial price is 0.01 SUI (10_000_000 MIST)
        assert!(profile_nft::get_price(&config) == PAYMENT_AMOUNT, 0);

        // Verify treasury is set to deployer
        assert!(profile_nft::get_treasury(&config) == ADMIN, 1);

        ts::return_shared(config);
    };

    ts::end(scenario);
}

// ===== Payment Tests =====

#[test]
fun test_pay_for_generation_exact_amount() {
    let mut scenario = init_test_scenario();

    // Mint exactly 0.01 SUI for user
    mint_sui(&mut scenario, USER1, PAYMENT_AMOUNT);

    ts::next_tx(&mut scenario, USER1);
    {
        let config = ts::take_shared<PaymentConfig>(&scenario);
        let payment = ts::take_from_sender<Coin<SUI>>(&scenario);

        // Pay for generation
        profile_nft::pay_for_generation(payment, &config, ts::ctx(&mut scenario));

        ts::return_shared(config);
    };

    // Verify treasury received the payment
    ts::next_tx(&mut scenario, ADMIN);
    {
        let treasury_coin = ts::take_from_sender<Coin<SUI>>(&scenario);
        assert!(coin::value(&treasury_coin) == PAYMENT_AMOUNT, 0);
        ts::return_to_sender(&scenario, treasury_coin);
    };

    ts::end(scenario);
}

#[test]
fun test_pay_for_generation_with_overpayment() {
    let mut scenario = init_test_scenario();

    // Mint 0.05 SUI for user (overpayment)
    let overpayment_amount = PAYMENT_AMOUNT * 5;
    mint_sui(&mut scenario, USER1, overpayment_amount);

    ts::next_tx(&mut scenario, USER1);
    {
        let config = ts::take_shared<PaymentConfig>(&scenario);
        let payment = ts::take_from_sender<Coin<SUI>>(&scenario);

        // Pay for generation
        profile_nft::pay_for_generation(payment, &config, ts::ctx(&mut scenario));

        ts::return_shared(config);
    };

    // Verify user received change
    ts::next_tx(&mut scenario, USER1);
    {
        let change = ts::take_from_sender<Coin<SUI>>(&scenario);
        assert!(coin::value(&change) == overpayment_amount - PAYMENT_AMOUNT, 0);
        ts::return_to_sender(&scenario, change);
    };

    // Verify treasury received exact payment
    ts::next_tx(&mut scenario, ADMIN);
    {
        let treasury_coin = ts::take_from_sender<Coin<SUI>>(&scenario);
        assert!(coin::value(&treasury_coin) == PAYMENT_AMOUNT, 1);
        ts::return_to_sender(&scenario, treasury_coin);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = profile_nft::EInsufficientPayment)] // EInsufficientPayment
fun test_pay_for_generation_insufficient_payment() {
    let mut scenario = init_test_scenario();

    // Mint less than required amount
    mint_sui(&mut scenario, USER1, PAYMENT_AMOUNT - 1);

    ts::next_tx(&mut scenario, USER1);
    {
        let config = ts::take_shared<PaymentConfig>(&scenario);
        let payment = ts::take_from_sender<Coin<SUI>>(&scenario);

        // This should fail with EInsufficientPayment
        profile_nft::pay_for_generation(payment, &config, ts::ctx(&mut scenario));

        ts::return_shared(config);
    };

    ts::end(scenario);
}

// ===== NFT Minting Tests =====

#[test]
fun test_mint_nft_creates_nft() {
    let mut scenario = init_test_scenario();

    ts::next_tx(&mut scenario, USER1);
    {
        let name = b"Test Profile NFT";
        let description = b"A test profile picture";
        let image_url = b"https://walrus.test/blob123";

        profile_nft::mint_nft(
            name,
            description,
            image_url,
            ts::ctx(&mut scenario),
        );
    };

    // Verify NFT was created and transferred to user
    ts::next_tx(&mut scenario, USER1);
    {
        let nft = ts::take_from_sender<ProfileNFT>(&scenario);

        // Verify NFT properties
        assert!(profile_nft::get_name(&nft) == std::string::utf8(b"Test Profile NFT"), 0);
        assert!(
            profile_nft::get_description(&nft) == std::string::utf8(b"A test profile picture"),
            1,
        );
        assert!(
            profile_nft::get_image_url(&nft) == std::string::utf8(b"https://walrus.test/blob123"),
            2,
        );
        assert!(profile_nft::get_creator(&nft) == USER1, 3);
        // Timestamp will be 0 in test environment
        let _ = profile_nft::get_created_at(&nft);

        ts::return_to_sender(&scenario, nft);
    };

    ts::end(scenario);
}

#[test]
fun test_mint_multiple_nfts() {
    let mut scenario = init_test_scenario();

    // Mint first NFT
    ts::next_tx(&mut scenario, USER1);
    {
        profile_nft::mint_nft(
            b"NFT #1",
            b"First NFT",
            b"https://walrus.test/blob1",
            ts::ctx(&mut scenario),
        );
    };

    // Mint second NFT
    ts::next_tx(&mut scenario, USER1);
    {
        profile_nft::mint_nft(
            b"NFT #2",
            b"Second NFT",
            b"https://walrus.test/blob2",
            ts::ctx(&mut scenario),
        );
    };

    // Verify both NFTs exist
    ts::next_tx(&mut scenario, USER1);
    {
        let nft1 = ts::take_from_sender<ProfileNFT>(&scenario);
        let nft2 = ts::take_from_sender<ProfileNFT>(&scenario);

        // Verify they are different NFTs
        assert!(object::id(&nft1) != object::id(&nft2), 0);

        ts::return_to_sender(&scenario, nft1);
        ts::return_to_sender(&scenario, nft2);
    };

    ts::end(scenario);
}

// ===== NFT Transfer Tests =====

#[test]
fun test_transfer_nft() {
    let mut scenario = init_test_scenario();

    // Mint NFT for USER1
    ts::next_tx(&mut scenario, USER1);
    {
        profile_nft::mint_nft(
            b"Transfer Test NFT",
            b"Testing NFT transfer",
            b"https://walrus.test/transfer",
            ts::ctx(&mut scenario),
        );
    };

    // Transfer NFT to USER2
    ts::next_tx(&mut scenario, USER1);
    {
        let nft = ts::take_from_sender<ProfileNFT>(&scenario);
        profile_nft::transfer_nft(nft, USER2, ts::ctx(&mut scenario));
    };

    // Verify USER2 received the NFT
    ts::next_tx(&mut scenario, USER2);
    {
        let nft = ts::take_from_sender<ProfileNFT>(&scenario);

        // Verify creator is still USER1
        assert!(profile_nft::get_creator(&nft) == USER1, 0);

        ts::return_to_sender(&scenario, nft);
    };

    ts::end(scenario);
}

// ===== Admin Functions Tests =====

#[test]
fun test_update_price() {
    let mut scenario = init_test_scenario();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut config = ts::take_shared<PaymentConfig>(&scenario);

        // Update price to 0.02 SUI
        let new_price = 20_000_000;
        profile_nft::update_price(&mut config, new_price, ts::ctx(&mut scenario));

        // Verify price was updated
        assert!(profile_nft::get_price(&config) == new_price, 0);

        ts::return_shared(config);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = profile_nft::EInvalidPrice)] // EInvalidPrice
fun test_update_price_unauthorized() {
    let mut scenario = init_test_scenario();

    // Non-treasury user tries to update price
    ts::next_tx(&mut scenario, USER1);
    {
        let mut config = ts::take_shared<PaymentConfig>(&scenario);

        // This should fail - USER1 is not the treasury
        profile_nft::update_price(&mut config, 20_000_000, ts::ctx(&mut scenario));

        ts::return_shared(config);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = profile_nft::EInvalidPrice)] // EInvalidPrice
fun test_update_price_to_zero() {
    let mut scenario = init_test_scenario();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut config = ts::take_shared<PaymentConfig>(&scenario);

        // This should fail - price cannot be zero
        profile_nft::update_price(&mut config, 0, ts::ctx(&mut scenario));

        ts::return_shared(config);
    };

    ts::end(scenario);
}

#[test]
fun test_update_treasury() {
    let mut scenario = init_test_scenario();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut config = ts::take_shared<PaymentConfig>(&scenario);

        // Update treasury to USER1
        profile_nft::update_treasury(&mut config, USER1, ts::ctx(&mut scenario));

        // Verify treasury was updated
        assert!(profile_nft::get_treasury(&config) == USER1, 0);

        ts::return_shared(config);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = profile_nft::EInvalidPrice)] // EInvalidPrice
fun test_update_treasury_unauthorized() {
    let mut scenario = init_test_scenario();

    // Non-treasury user tries to update treasury
    ts::next_tx(&mut scenario, USER1);
    {
        let mut config = ts::take_shared<PaymentConfig>(&scenario);

        // This should fail - USER1 is not the treasury
        profile_nft::update_treasury(&mut config, USER2, ts::ctx(&mut scenario));

        ts::return_shared(config);
    };

    ts::end(scenario);
}

// ===== Integration Tests =====

#[test]
fun test_full_workflow() {
    let mut scenario = init_test_scenario();

    // Step 1: User pays for generation
    mint_sui(&mut scenario, USER1, PAYMENT_AMOUNT);

    ts::next_tx(&mut scenario, USER1);
    {
        let config = ts::take_shared<PaymentConfig>(&scenario);
        let payment = ts::take_from_sender<Coin<SUI>>(&scenario);

        profile_nft::pay_for_generation(payment, &config, ts::ctx(&mut scenario));

        ts::return_shared(config);
    };

    // Step 2: User mints NFT after receiving generated image
    ts::next_tx(&mut scenario, USER1);
    {
        profile_nft::mint_nft(
            b"My Awesome Profile",
            b"AI-generated profile picture",
            b"https://walrus.test/myprofile",
            ts::ctx(&mut scenario),
        );
    };

    // Step 3: Verify NFT was created
    ts::next_tx(&mut scenario, USER1);
    {
        let nft = ts::take_from_sender<ProfileNFT>(&scenario);
        assert!(profile_nft::get_name(&nft) == std::string::utf8(b"My Awesome Profile"), 0);
        ts::return_to_sender(&scenario, nft);
    };

    // Step 4: Verify treasury received payment
    ts::next_tx(&mut scenario, ADMIN);
    {
        let treasury_coin = ts::take_from_sender<Coin<SUI>>(&scenario);
        assert!(coin::value(&treasury_coin) == PAYMENT_AMOUNT, 1);
        ts::return_to_sender(&scenario, treasury_coin);
    };

    ts::end(scenario);
}
