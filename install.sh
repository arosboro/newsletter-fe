echo "Installing Rust with rustup..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y  2> /dev/null
echo "Configuring shell (source \"$HOME/.cargo/env\")..."
source "$HOME/.cargo/env"
echo "Installing wasm-pack..."
cargo install wasm-pack
npm install
npm run wasm