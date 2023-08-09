echo "Installing Rust..."
amazon-linux-extras install rust1
echo "Updating PATH for cargo binaries."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
PATH=$PATH:$HOME/.cargo/bin
echo "Installing wasm-pack..."
cargo install wasm-pack
echo "Building wasm..."
yarn run wasm
