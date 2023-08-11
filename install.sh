echo "Installing Rust with rustup..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y  2> /dev/null
echo "Updating PATH for cargo binaries..."
PATH=$PATH:$HOME/.cargo/bin
echo "Installing wasm-pack..."
cargo install wasm-pack
echo "Installing typescript..."
npm install -g typescript
