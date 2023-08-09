echo "Installing Rustup..."
# Install Rustup (compiler)
# curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
amazon-linux-extras install rust1
rustc --version
rustup update
echo "Installing wasm-pack..."
# Install wasm-pack
yarn global add wasm-pack
yarn run wasm
