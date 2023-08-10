echo "Installing Rust..."
amazon-linux-extras install rust1
curl https://sh.rustup.rs -sSf | sh -s -- -y
echo "Updating PATH for cargo binaries..."
PATH=$PATH:$HOME/.cargo/bin
echo "Installing wasm-pack..."
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
echo "Building wasm..."
yarn run wasm
