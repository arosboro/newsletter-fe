echo "Installing Rust with rustup..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y  2> /dev/null
"Configuring shell prior to installing rust..."
source "$HOME/.cargo/env"
npm install