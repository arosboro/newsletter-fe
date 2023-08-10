echo "Installing Rust..."
amazon-linux-extras install rust1
echo "Updating PATH for cargo binaries..."
PATH=$PATH:$HOME/.cargo/bin
echo "Installing wasm-pack..."
# Determine your Rust version
echo `rustc --version`
RUST_VERSION="1.68.2"
# Download the correct Wasm32 target
curl -O "https://static.rust-lang.org/dist/rust-std-$RUST_VERSION-wasm32-unknown-unknown.tar.gz"
# Unpack the tarball
tar -xzvf "rust-std-$RUST_VERSION-wasm32-unknown-unknown.tar.gz"
# Move the wasm32-unknown-unknown folder to the sysroot
SYSROOT_PATH=$(rustc --print sysroot)
mv "rust-std-$RUST_VERSION-wasm32-unknown-unknown/rust-std-wasm32-unknown-unknown/lib/rustlib/wasm32-unknown-unknown" "$SYSROOT_PATH/lib/rustlib/"
cargo clean
cargo install wasm-pack
echo "Building wasm..."
yarn run wasm
