export const NewsletterProgramId = 'newsletter_v0_0_8.aleo';

export const NewsletterProgram = `program newsletter_v0_0_8.aleo;

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

struct Bytes32:
    b0 as u128;
    b1 as u128;

struct Bytes64:
    b0 as u128;
    b1 as u128;
    b2 as u128;
    b3 as u128;

struct Bytes112:
    b0 as u128;
    b1 as u128;
    b2 as u128;
    b3 as u128;
    b4 as u128;
    b5 as u128;
    b6 as u128;

struct SharedSecret:
    shared_public_key as Bytes64;
    recipient as Bytes112;

struct SharedIssue:
    nonce as Bytes64;
    path as Bytes64;

record Newsletter:
    owner as address.private;
    op as address.private;
    id as field.private;
    member_sequence as field.private;
    issue_sequence as field.private;
    base as boolean.private;
    revision as boolean.private;
    title as Bytes64.private;
    title_nonce as Bytes24.private;
    template as Bytes64.private;
    template_nonce as Bytes24.private;
    content as Bytes64.private;
    content_nonce as Bytes24.private;
    group_symmetric_key as Bytes32.private;
    individual_private_key as Bytes32.private;

record Subscription:
    owner as address.private;
    op as address.private;
    id as field.private;
    member_sequence as field.private;
    member_secret_idx as field.private;


mapping newsletter_member_sequence:
	key left as field.public;
	value right as field.public;


mapping member_secrets:
	key left as field.public;
	value right as SharedSecret.public;


mapping newsletter_issue_sequence:
	key left as field.public;
	value right as field.public;


mapping newsletter_issues:
	key left as field.public;
	value right as SharedIssue.public;

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


function main:
    input r0 as Bytes64.private;
    input r1 as Bytes24.private;
    input r2 as Bytes64.private;
    input r3 as Bytes24.private;
    input r4 as Bytes64.private;
    input r5 as Bytes24.private;
    input r6 as Bytes32.private;
    input r7 as Bytes32.private;
    input r8 as Bytes64.private;
    input r9 as Bytes112.private;
    sub.w 0u128 1u128 into r10;
    div r10 2u128 into r11;
    sub 0field 1field into r12;
    div r12 2field into r13;
    hash.bhp256 r6 into r14 as field;    hash.bhp256 r7 into r15 as field;    call cantors_pairing r14 1field into r16;
    hash.bhp256 r16 into r17 as field;    cast self.caller self.caller r14 1field 1field true false r0 r1 r2 r3 r4 r5 r6 r7 into r18 as Newsletter.record;
    output r18 as Newsletter.record;

    finalize r14 1field r17 r8 r9;

finalize main:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as Bytes64.public;
    input r4 as Bytes112.public;
    is.eq r1 1field into r5;
    assert.eq r5 true;
    get.or_use newsletter_member_sequence[r0] 0field into r6;
    is.eq r6 0field into r7;
    assert.eq r7 true;
    set r1 into newsletter_member_sequence[r0];
    cast 0u128 0u128 0u128 0u128 into r8 as Bytes64;
    cast 0u128 0u128 0u128 0u128 0u128 0u128 0u128 into r9 as Bytes112;
    is.neq r3 r8 into r10;
    assert.eq r10 true;
    is.neq r4 r9 into r11;
    assert.eq r11 true;
    cast r8 r9 into r12 as SharedSecret;
    get.or_use member_secrets[r2] r12 into r13;
    is.eq r13.shared_public_key r8 into r14;
    assert.eq r14 true;
    is.eq r13.recipient r9 into r15;
    assert.eq r15 true;
    cast r3 r4 into r16 as SharedSecret;
    set r16 into member_secrets[r2];


function invite:
    input r0 as Newsletter.record;
    input r1 as address.private;
    is.eq r0.owner self.caller into r2;
    assert.eq r2 true;
    is.eq r0.op self.caller into r3;
    assert.eq r3 true;
    add r0.member_sequence 1field into r4;
    cast 0u128 0u128 into r5 as Bytes32;
    cast self.caller r0.op r0.id r4 r0.issue_sequence true false r0.title r0.title_nonce r0.template r0.template_nonce r0.content r0.content_nonce r0.group_symmetric_key r0.individual_private_key into r6 as Newsletter.record;
    cast r1 r0.op r0.id r4 r0.issue_sequence true false r0.title r0.title_nonce r0.template r0.template_nonce r0.content r0.content_nonce r0.group_symmetric_key r5 into r7 as Newsletter.record;
    output r6 as Newsletter.record;
    output r7 as Newsletter.record;

    finalize r0.id r4;

finalize invite:
    input r0 as field.public;
    input r1 as field.public;
    get.or_use newsletter_member_sequence[r0] 0field into r2;
    is.neq r2 0field into r3;
    assert.eq r3 true;
    set r1 into newsletter_member_sequence[r0];


function accept:
    input r0 as Newsletter.record;
    input r1 as Bytes32.private;
    input r2 as Bytes64.private;
    input r3 as Bytes112.private;
    is.eq self.caller r0.owner into r4;
    assert.eq r4 true;
    is.neq self.caller r0.op into r5;
    assert.eq r5 true;
    is.eq r0.base true into r6;
    assert.eq r6 true;
    is.eq r0.revision false into r7;
    assert.eq r7 true;
    call cantors_pairing r0.id r0.member_sequence into r8;
    hash.bhp256 r8 into r9 as field;    cast self.caller r0.op r0.id r0.member_sequence r0.issue_sequence true false r0.title r0.title_nonce r0.template r0.template_nonce r0.content r0.content_nonce r0.group_symmetric_key r1 into r10 as Newsletter.record;
    cast self.caller r0.op r0.id r0.member_sequence r9 into r11 as Subscription.record;
    cast r0.op r0.op r0.id r0.member_sequence r9 into r12 as Subscription.record;
    output r10 as Newsletter.record;
    output r11 as Subscription.record;
    output r12 as Subscription.record;

    finalize r9 r2 r3;

finalize accept:
    input r0 as field.public;
    input r1 as Bytes64.public;
    input r2 as Bytes112.public;
    cast 0u128 0u128 0u128 0u128 into r3 as Bytes64;
    cast 0u128 0u128 0u128 0u128 0u128 0u128 0u128 into r4 as Bytes112;
    is.neq r1 r3 into r5;
    assert.eq r5 true;
    is.neq r2 r4 into r6;
    assert.eq r6 true;
    cast r3 r4 into r7 as SharedSecret;
    get.or_use member_secrets[r0] r7 into r8;
    is.eq r8.shared_public_key r3 into r9;
    assert.eq r9 true;
    is.eq r8.recipient r4 into r10;
    assert.eq r10 true;
    cast r1 r2 into r11 as SharedSecret;
    set r11 into member_secrets[r0];


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
    is.eq r0.base true into r8;
    assert.eq r8 true;
    is.eq r0.revision false into r9;
    assert.eq r9 true;
    add r0.issue_sequence 1field into r10;
    cast self.caller r0.op r0.id r0.member_sequence r10 r0.base r0.revision r0.title r0.title_nonce r0.template r0.template_nonce r0.content r0.content_nonce r0.group_symmetric_key r0.individual_private_key into r11 as Newsletter.record;
    output r11 as Newsletter.record;

    finalize r0.id r10 r5 r6;

finalize deliver:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as Bytes64.public;
    input r3 as Bytes64.public;
    cast 0u128 0u128 0u128 0u128 into r4 as Bytes64;
    is.neq r2 r4 into r5;
    assert.eq r5 true;
    is.neq r3 r4 into r6;
    assert.eq r6 true;
    cast r4 r4 into r7 as SharedIssue;
    cast r3 r2 into r8 as SharedIssue;
    add r0 r1 into r9;
    get.or_use newsletter_issues[r9] r7 into r10;
    is.eq r10 r7 into r11;
    assert.eq r11 true;
    set r1 into newsletter_issue_sequence[r0];
    add r0 r1 into r12;
    set r8 into newsletter_issues[r12];


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
    cast self.caller r0.op r0.id r0.member_sequence r0.issue_sequence r0.base r0.revision r1 r2 r3 r4 r5 r6 r0.group_symmetric_key r0.individual_private_key into r10 as Newsletter.record;
    output r10 as Newsletter.record;


function unsub:
    input r0 as Subscription.record;
    is.eq r0.owner self.caller into r1;
    is.eq r0.op self.caller into r2;
    or r1 r2 into r3;
    assert.eq r3 true;
    is.eq r0.owner self.caller into r4;
    output r4 as boolean.private;

    finalize r0.member_secret_idx;

finalize unsub:
    input r0 as field.public;
    cast 0u128 0u128 0u128 0u128 into r1 as Bytes64;
    cast 0u128 0u128 0u128 0u128 0u128 0u128 0u128 into r2 as Bytes112;
    cast r1 r2 into r3 as SharedSecret;
    get.or_use member_secrets[r0] r3 into r4;
    is.neq r4.shared_public_key r1 into r5;
    assert.eq r5 true;
    is.neq r4.recipient r2 into r6;
    assert.eq r6 true;
    cast r1 r2 into r7 as SharedSecret;
    set r7 into member_secrets[r0];
`;
