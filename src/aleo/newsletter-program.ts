/**
 * This is the program id for the newsletter program deployed on Aleo Testnet v3.
 * It is used to fetch the program from the blockchain.
 */
export const NewsletterProgramId = 'newsletter_v0_1_0.aleo';

/**
 * This is the newsletter program deployed on Aleo Testnet v3.
 * It is meant to review and be used with the deploy action for the leo wallet to deploy.
 */
export const NewsletterProgram = `program newsletter_v0_1_0.aleo;

struct Bytes24:
    b0 as u8;
    b1 as u8;
    b2 as u8;
    b3 as u8;
    b4 as u8;
    b5 as u8;
    b6 as u8;
    b7 as u8;
    b8 as u8;
    b9 as u8;
    b10 as u8;
    b11 as u8;
    b12 as u8;
    b13 as u8;
    b14 as u8;
    b15 as u8;
    b16 as u8;
    b17 as u8;
    b18 as u8;
    b19 as u8;
    b20 as u8;
    b21 as u8;
    b22 as u8;
    b23 as u8;

struct Bytes64:
    b0 as u128;
    b1 as u128;
    b2 as u128;
    b3 as u128;

struct SharedSecret:
    shared_public_key as Bytes64;
    recipient as Bytes64;

struct SharedIssue:
    nonce as Bytes64;
    path as Bytes64;

record Newsletter:
    owner as address.private;
    op as address.private;
    id as field.private;
    member_sequence as field.private;
    base as boolean.private;
    revision as boolean.private;
    title as Bytes64.private;
    title_nonce as Bytes24.private;
    template as Bytes64.private;
    template_nonce as Bytes24.private;
    content as Bytes64.private;
    content_nonce as Bytes24.private;
    group_symmetric_key as Bytes64.private;
    individual_private_key as Bytes64.private;

record Subscription:
    owner as address.private;
    op as address.private;
    id as field.private;
    member_sequence as field.private;
    member_secret_idx as field.private;


mapping newsletter_member_sequence:
	key as field.public;
	value as field.public;


mapping member_secrets:
	key as field.public;
	value as SharedSecret.public;


mapping newsletter_issue_sequence:
	key as field.public;
	value as field.public;


mapping newsletter_issues:
	key as field.public;
	value as SharedIssue.public;

closure cantors_pairing:
    input r0 as field;
    input r1 as field;
    add r0 r1 into r2;
    add r0 r1 into r3;
    add r3 1field into r4;
    mul r2 r4 into r5;
    div r5 2field into r6;
    add r6 r1 into r7;
    output r7 as field;


closure is_empty_bytes64:
    input r0 as Bytes64;
    is.eq r0.b0 r0.b1 into r1;
    is.eq r0.b0 0u128 into r2;
    and r1 r2 into r3;
    is.eq r0.b2 r0.b3 into r4;
    is.eq r0.b2 0u128 into r5;
    and r4 r5 into r6;
    and r3 r6 into r7;
    output r7 as boolean;


function main:
    input r0 as Bytes64.private;
    input r1 as Bytes24.private;
    input r2 as Bytes64.private;
    input r3 as Bytes24.private;
    input r4 as Bytes64.private;
    input r5 as Bytes24.private;
    input r6 as Bytes64.private;
    input r7 as Bytes64.private;
    input r8 as Bytes64.private;
    input r9 as Bytes64.private;
    call is_empty_bytes64 r8 into r10;
    not r10 into r11;
    assert.eq r11 true;
    call is_empty_bytes64 r9 into r12;
    not r12 into r13;
    assert.eq r13 true;
    hash.bhp256 r6 into r14 as field;
    call cantors_pairing r14 1field into r15;
    cast self.caller self.caller r14 1field true false r0 r1 r2 r3 r4 r5 r6 r7 into r16 as Newsletter.record;
    async main r14 1field r15 r8 r9 into r17;    output r16 as Newsletter.record;
    output r17 as newsletter_v0_1_0.aleo/main.future;

finalize main:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as Bytes64.public;
    input r4 as Bytes64.public;
    is.eq r1 1field into r5;
    assert.eq r5 true;
    contains newsletter_member_sequence[r0] into r6;
    is.eq r6 false into r7;
    assert.eq r7 true;
    contains member_secrets[r2] into r8;
    is.eq r8 false into r9;
    assert.eq r9 true;
    set r1 into newsletter_member_sequence[r0];
    cast r3 r4 into r10 as SharedSecret;
    set r10 into member_secrets[r2];


function invite:
    input r0 as Newsletter.record;
    input r1 as address.private;
    is.eq r0.owner self.caller into r2;
    assert.eq r2 true;
    is.eq r0.op self.caller into r3;
    assert.eq r3 true;
    is.eq r0.base true into r4;
    assert.eq r4 true;
    is.eq r0.revision false into r5;
    assert.eq r5 true;
    add r0.member_sequence 1field into r6;
    cast 0u128 0u128 0u128 0u128 into r7 as Bytes64;
    cast self.caller r0.op r0.id r6 r0.base r0.revision r0.title r0.title_nonce r0.template r0.template_nonce r0.content r0.content_nonce r0.group_symmetric_key r0.individual_private_key into r8 as Newsletter.record;
    not r0.base into r9;
    not r0.revision into r10;
    cast r1 r0.op r0.id r6 r9 r10 r0.title r0.title_nonce r0.template r0.template_nonce r0.content r0.content_nonce r0.group_symmetric_key r7 into r11 as Newsletter.record;
    async invite r0.id r6 into r12;    output r8 as Newsletter.record;
    output r11 as Newsletter.record;
    output r12 as newsletter_v0_1_0.aleo/invite.future;

finalize invite:
    input r0 as field.public;
    input r1 as field.public;
    contains newsletter_member_sequence[r0] into r2;
    is.eq r2 true into r3;
    assert.eq r3 true;
    set r1 into newsletter_member_sequence[r0];


function accept:
    input r0 as Newsletter.record;
    input r1 as Bytes64.private;
    input r2 as Bytes64.private;
    input r3 as Bytes64.private;
    is.eq self.caller r0.owner into r4;
    assert.eq r4 true;
    is.neq self.caller r0.op into r5;
    assert.eq r5 true;
    is.eq r0.base false into r6;
    assert.eq r6 true;
    is.eq r0.revision true into r7;
    assert.eq r7 true;
    call is_empty_bytes64 r2 into r8;
    not r8 into r9;
    assert.eq r9 true;
    call is_empty_bytes64 r3 into r10;
    not r10 into r11;
    assert.eq r11 true;
    call cantors_pairing r0.id r0.member_sequence into r12;
    cast self.caller r0.op r0.id r0.member_sequence r0.base r0.revision r0.title r0.title_nonce r0.template r0.template_nonce r0.content r0.content_nonce r0.group_symmetric_key r1 into r13 as Newsletter.record;
    cast self.caller r0.op r0.id r0.member_sequence r12 into r14 as Subscription.record;
    cast r0.op r0.op r0.id r0.member_sequence r12 into r15 as Subscription.record;
    async accept r12 r2 r3 into r16;    output r13 as Newsletter.record;
    output r14 as Subscription.record;
    output r15 as Subscription.record;
    output r16 as newsletter_v0_1_0.aleo/accept.future;

finalize accept:
    input r0 as field.public;
    input r1 as Bytes64.public;
    input r2 as Bytes64.public;
    contains member_secrets[r0] into r3;
    is.eq r3 false into r4;
    assert.eq r4 true;
    cast r1 r2 into r5 as SharedSecret;
    set r5 into member_secrets[r0];


function deliver:
    input r0 as Newsletter.record;
    input r1 as Bytes64.private;
    input r2 as Bytes24.private;
    input r3 as Bytes64.private;
    input r4 as Bytes24.private;
    input r5 as Bytes64.private;
    input r6 as Bytes64.private;
    is.eq r0.owner self.caller into r7;
    assert.eq r7 true;
    call is_empty_bytes64 r5 into r8;
    not r8 into r9;
    assert.eq r9 true;
    call is_empty_bytes64 r6 into r10;
    not r10 into r11;
    assert.eq r11 true;
    cast self.caller r0.op r0.id r0.member_sequence r0.base r0.revision r1 r2 r0.template r0.template_nonce r3 r4 r0.group_symmetric_key r0.individual_private_key into r12 as Newsletter.record;
    async deliver r0.id r5 r6 into r13;    output r12 as Newsletter.record;
    output r13 as newsletter_v0_1_0.aleo/deliver.future;

finalize deliver:
    input r0 as field.public;
    input r1 as Bytes64.public;
    input r2 as Bytes64.public;
    get.or_use newsletter_issue_sequence[r0] 0field into r3;
    add r0 r3 into r4;
    add r0 r3 into r5;
    add r5 1field into r6;
    mul r4 r6 into r7;
    div r7 2field into r8;
    add r8 r3 into r9;
    contains newsletter_issues[r9] into r10;
    is.eq r10 false into r11;
    assert.eq r11 true;
    add r3 1field into r12;
    set r12 into newsletter_issue_sequence[r0];
    cast r2 r1 into r13 as SharedIssue;
    set r13 into newsletter_issues[r9];


function update:
    input r0 as Newsletter.record;
    input r1 as Bytes64.private;
    input r2 as Bytes24.private;
    input r3 as Bytes64.private;
    input r4 as Bytes24.private;
    input r5 as Bytes64.private;
    input r6 as Bytes24.private;
    is.eq r0.owner self.caller into r7;
    assert.eq r7 true;
    is.eq r0.base true into r8;
    assert.eq r8 true;
    is.eq r0.revision false into r9;
    assert.eq r9 true;
    cast self.caller r0.op r0.id r0.member_sequence r0.base r0.revision r1 r2 r3 r4 r5 r6 r0.group_symmetric_key r0.individual_private_key into r10 as Newsletter.record;
    output r10 as Newsletter.record;


function unsub:
    input r0 as Subscription.record;
    is.eq r0.owner self.caller into r1;
    is.eq r0.op self.caller into r2;
    or r1 r2 into r3;
    assert.eq r3 true;
    is.eq r0.owner self.caller into r4;
    async unsub r0.member_secret_idx into r5;    output r4 as boolean.private;
    output r5 as newsletter_v0_1_0.aleo/unsub.future;

finalize unsub:
    input r0 as field.public;
    contains member_secrets[r0] into r1;
    is.eq r1 true into r2;
    assert.eq r2 true;
    remove member_secrets[r0];
`;
