## CipherPage App https://cipher.page

The app is a react-redux message board with built in NaCL encryption using symmetric and asymmetric key management which only authorized parties can access to decrypt communications stored off-chain on IPFS.

There are 3 routes which can direct interaction with the Application:

### Create

Create a Newsletter/cipher.page This lets you manage a newsletter to invite other addresses to participate in. The newsletter starts with a template, which you can toggle to fill with content. There is a privacy toggle where at any time you can preview the cipher text of your work.

Users can invite members to created Newsletters

Users can update newsletters without delivering asymmetric cipher text of such to the members.

Users can deliver asymmetric content to IPFS to be accessed through network mappings by users which can then respond in kind.

### Consume

At any time the user can preview or consume newsletters they are a party to or have created in the past. This page can also be used in the moment before a network call to preview the resulting contents.

Manage subscriptions (accept/unsub)

Read issues (sent by calling deliver by any subscriber).

### Deploy/Obey

If the contract has yet to be deployed it can be done from this page when it says Deploy.

If it says Obey, the contract has been deployed and a link is provided to review code onchain.

### Components, Features, Lib, Pages

See TypeDoc in docs folder. It is served on github pages at https://arosboro.github.io/newsletter-fe/

### Tests

A percentage of the application has coverage by integration testing so that it can be confirmed to be working. And rapidly deployed to production after tests pass. These are initiated through GitHub actions.
