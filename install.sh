echo "Installing Rust..."
# amazon-linux-extras install rust1
export HOME=/vercel
export CARGO_HOME=/vercel/.cargo
export RUSTUP_HOME=/vercel/.rustup
PATH=$PATH:$HOME/.cargo/bin
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
echo "Updating PATH for cargo binaries..."
echo "Installing wasm-pack..."
cargo install wasm-pack
echo "Building wasm..."
npm install -g typescript
npm run wasm
