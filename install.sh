echo "Installing Rustup..."
# Install Rustup (compiler)
# curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
# source "$HOME/.cargo/env"
amazon-linux-extras install rust1
# Adding binaries to path
echo "Installing wasm-pack..."
# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh -s -- -y
yarn run wasm
