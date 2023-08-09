echo "Installing Rust..."
amazon-linux-extras install rust1
echo "Updating PATH for cargo binaries."
PATH=$PATH:$HOME/.cargo/bin
echo "Installing wasm-pack..."
cargo install wasm-pack
echo "Building wasm..."
yarn run wasm
