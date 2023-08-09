echo "Installing Rust..."
amazon-linux-extras install rust1
echo "Installing wasm-pack..."
cargo install wasm-pack
echo "Building wasm..."
yarn run wasm
