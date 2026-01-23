module profile_nft::profile_nft {
    use std::string::{Self, String};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;

    // ===== Errors =====
    const EInsufficientPayment: u64 = 0;
    const EInvalidPrice: u64 = 1;

    // ===== Objects =====

    /// The ProfileNFT object representing a user's profile image NFT
    public struct ProfileNFT has key, store {
        id: UID,
        /// Name of the NFT (e.g., "My Profile #1")
        name: String,
        /// Description of the NFT
        description: String,
        /// Image URL pointing to Walrus storage
        image_url: String,
        /// Creator's address
        creator: address,
        /// Unix timestamp when created
        created_at: u64,
    }

    /// Configuration object for payment settings
    public struct PaymentConfig has key {
        id: UID,
        /// Price in MIST (0.01 SUI = 10_000_000 MIST)
        price: u64,
        /// Treasury address where payments are sent
        treasury: address,
    }

    // ===== Events =====

    public struct PaymentReceived has copy, drop {
        payer: address,
        amount: u64,
        timestamp: u64,
    }

    public struct NFTMinted has copy, drop {
        nft_id: ID,
        creator: address,
        name: String,
        image_url: String,
        timestamp: u64,
    }

    // ===== Initialization =====

    /// Module initializer - creates the payment configuration
    fun init(ctx: &mut TxContext) {
        let payment_config = PaymentConfig {
            id: object::new(ctx),
            price: 10_000_000, // 0.01 SUI in MIST
            treasury: ctx.sender(),
        };
        transfer::share_object(payment_config);
    }

    // ===== Entry Functions =====

    /// Accept payment for image generation
    /// Transfers the payment to the treasury and emits an event
    public entry fun pay_for_generation(
        mut payment: Coin<SUI>,
        config: &PaymentConfig,
        ctx: &mut TxContext
    ) {
        let payment_amount = coin::value(&payment);

        // Ensure sufficient payment
        assert!(payment_amount >= config.price, EInsufficientPayment);

        // If overpaid, split the exact amount and return the rest
        let payment_coin = if (payment_amount > config.price) {
            let change = coin::split(&mut payment, payment_amount - config.price, ctx);
            transfer::public_transfer(change, ctx.sender());
            payment
        } else {
            payment
        };

        // Transfer payment to treasury
        transfer::public_transfer(payment_coin, config.treasury);

        // Emit payment event
        event::emit(PaymentReceived {
            payer: ctx.sender(),
            amount: config.price,
            timestamp: ctx.epoch_timestamp_ms(),
        });
    }

    /// Mint a new ProfileNFT with the generated image URL
    public entry fun mint_nft(
        name: vector<u8>,
        description: vector<u8>,
        image_url: vector<u8>,
        ctx: &mut TxContext
    ) {
        let nft = ProfileNFT {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            image_url: string::utf8(image_url),
            creator: ctx.sender(),
            created_at: ctx.epoch_timestamp_ms(),
        };

        let nft_id = object::id(&nft);

        event::emit(NFTMinted {
            nft_id,
            creator: ctx.sender(),
            name: nft.name,
            image_url: nft.image_url,
            timestamp: nft.created_at,
        });

        // Transfer NFT to the creator
        transfer::public_transfer(nft, ctx.sender());
    }

    /// Transfer an NFT to a recipient
    public entry fun transfer_nft(
        nft: ProfileNFT,
        recipient: address,
        _ctx: &mut TxContext
    ) {
        transfer::public_transfer(nft, recipient);
    }

    /// Update payment configuration (only callable by current treasury)
    public entry fun update_price(
        config: &mut PaymentConfig,
        new_price: u64,
        ctx: &mut TxContext
    ) {
        assert!(ctx.sender() == config.treasury, EInvalidPrice);
        assert!(new_price > 0, EInvalidPrice);
        config.price = new_price;
    }

    /// Update treasury address (only callable by current treasury)
    public entry fun update_treasury(
        config: &mut PaymentConfig,
        new_treasury: address,
        ctx: &mut TxContext
    ) {
        assert!(ctx.sender() == config.treasury, EInvalidPrice);
        config.treasury = new_treasury;
    }

    // ===== View Functions =====

    /// Get the current price from config
    public fun get_price(config: &PaymentConfig): u64 {
        config.price
    }

    /// Get the treasury address from config
    public fun get_treasury(config: &PaymentConfig): address {
        config.treasury
    }

    /// Get NFT name
    public fun get_name(nft: &ProfileNFT): String {
        nft.name
    }

    /// Get NFT description
    public fun get_description(nft: &ProfileNFT): String {
        nft.description
    }

    /// Get NFT image URL
    public fun get_image_url(nft: &ProfileNFT): String {
        nft.image_url
    }

    /// Get NFT creator
    public fun get_creator(nft: &ProfileNFT): address {
        nft.creator
    }

    /// Get NFT creation timestamp
    public fun get_created_at(nft: &ProfileNFT): u64 {
        nft.created_at
    }

    // ===== Test-only Functions =====

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
