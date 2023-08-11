echo "Installing Rust..."
# amazon-linux-extras install rust1
export HOME=/vercel
export CARGO_HOME=/vercel/.cargo
export RUSTUP_HOME=/vercel/.rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
echo "Updating PATH for cargo binaries..."
PATH=$PATH:$HOME/.cargo/bin
echo "Installing wasm-pack..."
cargo install wasm-pack
echo "Building wasm..."
yarn global add typescript
yarn run wasm
