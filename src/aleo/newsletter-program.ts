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
    input r6 as Bytes64.private;
    input r7 as Bytes64.private;
    input r8 as Bytes64.private;
    input r9 as Bytes64.private;
    hash.bhp256 r6 into r10 as field;    call cantors_pairing r10 1field into r11;
    cast self.caller self.caller r10 1field true false r0 r1 r2 r3 r4 r5 r6 r7 into r12 as Newsletter.record;
    output r12 as Newsletter.record;

    finalize r10 1field r11 r8 r9;

finalize main:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as Bytes64.public;
    input r4 as Bytes64.public;
    is.eq r1 1field into r5;
    assert.eq r5 true;
    is.neq r3.b0 0u128 into r6;
    is.neq r3.b1 0u128 into r7;
    and r6 r7 into r8;
    is.neq r3.b2 0u128 into r9;
    and r8 r9 into r10;
    is.neq r3.b3 0u128 into r11;
    and r10 r11 into r12;
    assert.eq r12 true;
    is.neq r4.b0 0u128 into r13;
    is.neq r4.b1 0u128 into r14;
    and r13 r14 into r15;
    is.neq r4.b2 0u128 into r16;
    and r15 r16 into r17;
    is.neq r4.b3 0u128 into r18;
    and r17 r18 into r19;
    assert.eq r19 true;
    contains newsletter_member_sequence[r0] into r20;
    is.eq r20 false into r21;
    assert.eq r21 true;
    contains member_secrets[r2] into r22;
    is.eq r22 false into r23;
    assert.eq r23 true;
    set r1 into newsletter_member_sequence[r0];
    cast r3 r4 into r24 as SharedSecret;
    set r24 into member_secrets[r2];


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
    cast self.caller r0.op r0.id r6 true false r0.title r0.title_nonce r0.template r0.template_nonce r0.content r0.content_nonce r0.group_symmetric_key r0.individual_private_key into r8 as Newsletter.record;
    not r0.base into r9;
    not r0.revision into r10;
    cast r1 r0.op r0.id r6 r9 r10 r0.title r0.title_nonce r0.template r0.template_nonce r0.content r0.content_nonce r0.group_symmetric_key r7 into r11 as Newsletter.record;
    output r8 as Newsletter.record;
    output r11 as Newsletter.record;

    finalize r0.id r6;

finalize invite:
    input r0 as field.public;
    input r1 as field.public;
    contains newsletter_member_sequence[r0] into r2;
    is.eq r2 false into r3;
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
    call cantors_pairing r0.id r0.member_sequence into r8;
    cast self.caller r0.op r0.id r0.member_sequence true false r0.title r0.title_nonce r0.template r0.template_nonce r0.content r0.content_nonce r0.group_symmetric_key r1 into r9 as Newsletter.record;
    cast self.caller r0.op r0.id r0.member_sequence r8 into r10 as Subscription.record;
    cast r0.op r0.op r0.id r0.member_sequence r8 into r11 as Subscription.record;
    output r9 as Newsletter.record;
    output r10 as Subscription.record;
    output r11 as Subscription.record;

    finalize r8 r2 r3;

finalize accept:
    input r0 as field.public;
    input r1 as Bytes64.public;
    input r2 as Bytes64.public;
    is.neq r1.b0 0u128 into r3;
    is.neq r1.b1 0u128 into r4;
    and r3 r4 into r5;
    is.neq r1.b2 0u128 into r6;
    and r5 r6 into r7;
    is.neq r1.b3 0u128 into r8;
    and r7 r8 into r9;
    assert.eq r9 true;
    is.neq r2.b0 0u128 into r10;
    is.neq r2.b1 0u128 into r11;
    and r10 r11 into r12;
    is.neq r2.b2 0u128 into r13;
    and r12 r13 into r14;
    is.neq r2.b3 0u128 into r15;
    and r14 r15 into r16;
    assert.eq r16 true;
    contains member_secrets[r0] into r17;
    is.eq r17 false into r18;
    assert.eq r18 true;
    cast r1 r2 into r19 as SharedSecret;
    set r19 into member_secrets[r0];


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
    cast self.caller r0.op r0.id r0.member_sequence r0.base r0.revision r1 r2 r0.template r0.template_nonce r3 r4 r0.group_symmetric_key r0.individual_private_key into r8 as Newsletter.record;
    output r8 as Newsletter.record;

    finalize r0.id r5 r6;

finalize deliver:
    input r0 as field.public;
    input r1 as Bytes64.public;
    input r2 as Bytes64.public;
    is.neq r1.b0 0u128 into r3;
    is.neq r1.b1 0u128 into r4;
    and r3 r4 into r5;
    is.neq r1.b2 0u128 into r6;
    and r5 r6 into r7;
    is.neq r1.b3 0u128 into r8;
    and r7 r8 into r9;
    assert.eq r9 true;
    is.neq r2.b0 0u128 into r10;
    is.neq r2.b1 0u128 into r11;
    and r10 r11 into r12;
    is.neq r2.b2 0u128 into r13;
    and r12 r13 into r14;
    is.neq r2.b3 0u128 into r15;
    and r14 r15 into r16;
    assert.eq r16 true;
    get.or_use newsletter_issue_sequence[r0] 0field into r17;
    add r0 r17 into r18;
    add r0 r17 into r19;
    add r19 1field into r20;
    mul r18 r20 into r21;
    div r21 2field into r22;
    add r22 r17 into r23;
    contains newsletter_issues[r23] into r24;
    is.eq r24 false into r25;
    assert.eq r25 true;
    add r17 1field into r26;
    set r26 into newsletter_issue_sequence[r0];
    cast r2 r1 into r27 as SharedIssue;
    set r27 into newsletter_issues[r23];


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
    output r4 as boolean.private;

    finalize r0.member_secret_idx;

finalize unsub:
    input r0 as field.public;
    contains member_secrets[r0] into r1;
    is.eq r1 true into r2;
    assert.eq r2 true;
    remove member_secrets[r0];
`;
