---
id: 2535u769
title: Newsletter Front End and Aleo Contract
file_version: 1.1.3
app_version: 1.15.3
---

A frontend to handle asymmetric and symmetric key management between disparate parties. Users can create groups with the `newsletter_v0_0_8.aleo` contract and invite members to deliver issues (new content). Newsletters contain contents and template structure which is a loose representation of content. Privacy mode can be toggled on or off to show the cipher text of any given input.

## Project Frameworks

*   Vite

*   React

*   Redux Toolkit

*   @DemoxLabs Aleo Wallet Adapter

*   Vitest

*   Vite Plugin WASM Pack leverage of `snarkvm-wasm`

## Aleo

### Structs

Bytes24 This struct contains 24 u8 values that convert to 1 byte each. The entire value is frequently utilized as a BigInt nonce, for example.

Bytes64 This struct holds four u128 values, each of which maps to 16 bytes. When combined, these values represent a value under 64 bytes.

`SharedSecret`<swm-token data-swm-token=":src/features/subscriptions/subscriptionsSlice.ts:25:4:4:`export interface SharedSecret {`"/>This struct holds the `shared_public_key`<swm-token data-swm-token=":src/features/subscriptions/subscriptionsSlice.ts:26:1:1:`  shared_public_key: string[] | string;`"/> and recipient within the mapping available from the RPC server with respect to contract calls which initiated values there.

SharedIssue This struct holds the nonce and path (to IPFS) for the Group symmetric encrypted value which can be decrypted using `group_symmetric_key`<swm-token data-swm-token=":src/features/subscriptions/subscriptionsSlice.ts:126:3:3:`      const group_symmetric_key = decode(mapping.newsletter.data.group_symmetric_key);`"/> and `nonce`<swm-token data-swm-token=":src/features/newsletters/newslettersSlice.ts:61:1:1:`  nonce: string[] | string;`"/>.

### Records

Newsletter

*   owner - This is the record holder

*   op - This is the record instantiating address

*   id - This is a unique field value based on a BHP 256 hash\_to\_field algorithm running on the `group_symmetric_key`<swm-token data-swm-token=":src/features/subscriptions/subscriptionsSlice.ts:126:3:3:`      const group_symmetric_key = decode(mapping.newsletter.data.group_symmetric_key);`"/>.

*   `member_sequence`<swm-token data-swm-token=":src/features/subscriptions/subscriptionsSlice.ts:20:1:1:`    member_sequence: string;`"/> - The op chooses members to invite, and each time increments the member sequence so the number of members invited is reflected by this field value.

*   base: Whether or not the record owner is the op. Base indicates it's an owned record not a derivative record (Meaning it's not being used to deliver as an accepted subscriber, but rather the Newsletter creator holds the record).

*   revision: True when the record has been received through an invitation but not initially created by the record holder.

*   title: Bytes64 the IPFS path to the cipher-text of the title.

*   `title_nonce:`<swm-token data-swm-token=":src/features/newsletters/newslettersSlice.ts:37:1:2:`    title_nonce: string[] | string;`"/> Bytes24 the u8IntArray nonce of the cipher-text.

*   template: Bytes64 the IPFS path to the cipher-text of the template.

*   `template_nonce:`<swm-token data-swm-token=":src/features/newsletters/newslettersSlice.ts:35:1:2:`    template_nonce: string[] | string;`"/> Bytes24 the u8IntArray nonce of the cipher-text.

*   content: Bytes64 the IPFS path to the cipher-text of the content.

*   `content_nonce:`<swm-token data-swm-token=":src/features/newsletters/newslettersSlice.ts:39:1:2:`    content_nonce: string[] | string;`"/> Bytes24 the u8IntArray nonce of the cipher-text.

*   `group_symmetric_key:`<swm-token data-swm-token=":src/features/newsletters/newslettersSlice.ts:40:1:2:`    group_symmetric_key: string[] | string;`"/> Bytes64 the symmetric key for Group Encrypted Messaging.

*   `individual_private_key:`<swm-token data-swm-token=":src/features/newsletters/newslettersSlice.ts:41:1:2:`    individual_private_key: string[] | string;`"/> Bytes64 the individual private key paired to the mapping of the public key which indicates the user accepted the invite

Subscription

*   owner: The owner either op or the subscriber

*   op: The manager of the group.

*   id: This is a unique field value based on a BHP 256 hash\_to\_field algorithm running on the `group_symmetric_key`<swm-token data-swm-token=":src/features/subscriptions/subscriptionsSlice.ts:126:3:3:`      const group_symmetric_key = decode(mapping.newsletter.data.group_symmetric_key);`"/>.

*   `member_sequence:`<swm-token data-swm-token=":src/features/subscriptions/subscriptionsSlice.ts:20:1:2:`    member_sequence: string;`"/> This field value pertains to the sequence the member used with the cantor's pairing function in the mapping assignment.

*   `member_secret_idx:`<swm-token data-swm-token=":src/features/subscriptions/subscriptionsSlice.ts:21:1:2:`    member_secret_idx: string;`"/> This field value identifies the combination of the id and member sequence provided by cantor's pairing function.

### Mappings

newsletter\_member\_sequence: (Field => Field) The newsletter id is indexed to determine how many members have been invited to the newsletter group.

member\_secrets: (Field => SharedSecret) The cantor's pairing of member sequence of each member is mapped to Shared Public Key and Public Address

newsletter\_issue\_sequence: (Field => Field) Each time a member delivers an issue the sequence increments with respect to the key: newsleter.id.

newsletter\_issues: (Field => SharedIssue) Cantor's pairing with each `newsletter.id`<swm-token data-swm-token=":src/features/subscriptions/subscriptionsSlice.ts:74:22:24:`  // Determine member_secret_idx manually, relying on the cantors pairing with newsletter.id`"/> and `issue_sequence`<swm-token data-swm-token=":src/features/newsletters/newslettersSlice.ts:243:3:3:`    const issue_sequence = BigInt(issue_sequence_field.slice(0, -5));`"/> is used to capture the path to each digest and nonce of every encrypted field for all subscribers.

### Transitions

main<br/>

*   Inputs:

    *   title: Bytes64 the IPFS path to the title.

    *   `title_nonce:`<swm-token data-swm-token=":src/features/newsletters/newslettersSlice.ts:80:1:2:`  title_nonce: string;`"/> Bytes24 the nonce from the sodium library.

    *   template: Bytes64 the IPFS path to the template.

    *   `template_nonce:`<swm-token data-swm-token=":src/features/newsletters/newslettersSlice.ts:82:1:2:`  template_nonce: string;`"/> Bytes24 the nonce from the sodium library

    *   content: Bytes64 the IPFS path to the content.

    *   `content_nonce:`<swm-token data-swm-token=":src/features/newsletters/newslettersSlice.ts:84:1:2:`  content_nonce: string;`"/> Bytes24 the nonce from the sodium library.

    *   `group_symmetric_key:`<swm-token data-swm-token=":src/features/newsletters/newslettersSlice.ts:92:1:2:`  group_symmetric_key: string;`"/> Bytes64 the key for group communication.

    *   `individual_private_key:`<swm-token data-swm-token=":src/features/newsletters/newslettersSlice.ts:93:1:2:`  individual_private_key: string;`"/> Bytes64 the key for decrypting own messages.

    *   `shared_public_key:`<swm-token data-swm-token=":src/features/subscriptions/subscriptionsSlice.ts:95:3:4:`          const shared_public_key: SharedSecret = {`"/> Bytes64 the key that other people can use to send messages.

    *   shared\_recipient: Bytes64 the address for other transitions and messages.

invite

*   Inputs:

    *   newsletter: Newsletter the record indicating you can invite members to this group.

    *   recipient: address the user's address you want to send an invite to.

accept

*   Inputs:

    *   newsletter: Newsletter the record you received as a result of another user executing invite.

    *   secret: Bytes64 your private key.

    *   `shared_public_key:`<swm-token data-swm-token=":src/features/subscriptions/subscriptionsSlice.ts:95:3:4:`          const shared_public_key: SharedSecret = {`"/> Bytes64 the public key to match your secret.

    *   shared\_recipient: Bytes64 the address you signed up with.

deliver

*   Inputs:

    *   newsletter: Newsletter a newsletter record you hold.

    *   title: Bytes64 the IPFS path to the title you updated.

    *   `title_nonce:`<swm-token data-swm-token=":src/features/newsletters/newslettersSlice.ts:80:1:2:`  title_nonce: string;`"/> Bytes24 the U8IntArray of the nonce you used.

    *   content: Bytes64 the IPFS path to the content you updated.

    *   `content_nonce:`<swm-token data-swm-token=":src/features/newsletters/newslettersSlice.ts:84:1:2:`  content_nonce: string;`"/> Bytes24 the U8IntArray of the nonce you used.

    *   issue\_path: Bytes64 The IPFS path of the digests for every member receiving an issue.

    *   issue\_nonce: Bytes64 The U8IntArray of the nonce using Group Symmetric key which encrypted issue path's contents.

update

*   Inputs:

    *   newsletter: Newsletter a newsletter record you hold.

    *   title: Bytes64 the IPFS path to the title you updated.

    *   `title_nonce:`<swm-token data-swm-token=":src/features/newsletters/newslettersSlice.ts:80:1:2:`  title_nonce: string;`"/> Bytes24 the U8IntArray of the nonce you used.

    *   template: Bytes64 the IPFS path to the template you updated.

    *   `template_nonce:`<swm-token data-swm-token=":src/features/newsletters/newslettersSlice.ts:82:1:2:`  template_nonce: string;`"/> Bytes24 the U8IntArray of the nonce you used.

    *   content: Bytes64 the IPFS path to the content you updated.

    *   `content_nonce:`<swm-token data-swm-token=":src/features/newsletters/newslettersSlice.ts:84:1:2:`  content_nonce: string;`"/> Bytes24 the U8IntArray of the nonce you used.

unsub

*   Inputs:

    *   subscription: The subscription you wish to unsubscribe from.

### Helper Functions

cantors\_pairing: Map two field values to a field value which will not intersect if there is sufficient entropy when choosing `newsletter.id`<swm-token data-swm-token=":src/features/subscriptions/subscriptionsSlice.ts:74:22:24:`  // Determine member_secret_idx manually, relying on the cantors pairing with newsletter.id`"/>.

is\_empty\_bytes64: Determine if a Bytes64 struct contains only 0u128 values for b0, b1, b2, b3. Return bool.

## App

The app is a react-redux message board with built in NaCL encryption using symmetric and asymmetric key management which only authorized parties can access to decrypt communications stored off-chain on IPFS.

There are 3 routes which can direct interaction with the Application:<br/>

*   Create

    *   Create a Newsletter/cipher.page This lets you manage a newsletter to invite other addresses to participate in. The newsletter starts with a template, which you can toggle to fill with content. There is a privacy toggle where at any time you can preview the cipher text of your work.

    *   Users can invite members to created Newsletters

    *   Users can update newsletters without delivering asymmetric cipher text of such to the members.

    *   Users can deliver asymmetric content to IPFS to be accessed through network mappings by users which can then respond in kind.

*   Consume

    *   At any time the user can preview or consume newsletters they are a party to or have created in the past. This page can also be used in the moment before a network call to preview the resulting contents.

    *   Manage subscriptions (accept/unsub)

    *   Read issues (sent by calling deliver by any subscriber).

*   Deploy/Obey

    *   If the contract has yet to be deployed it can be done from this page when it says Deploy.

    *   If it says Obey, the contract has been deployed and a link is provided to review code onchain.

## Components, Features, Lib, Pages

See TypeDoc in docs folder

## Tests

A percentage of the application has coverage by integration testing so that it can be confirmed to be working. And rapidly deployed to production after tests pass. These are initiated through GitHub actions.

<br/>

<br/>

This file was generated by Swimm. [Click here to view it in the app](https://app.swimm.io/repos/Z2l0aHViJTNBJTNBbmV3c2xldHRlci1mZSUzQSUzQWFyb3Nib3Jv/docs/2535u769).
