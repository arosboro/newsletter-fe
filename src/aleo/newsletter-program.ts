export const NewsletterProgramId = 'newsletter_v4.aleo';

export const NewsletterProgram = `program newsletter_v4.aleo;

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
    shared_secret as Bytes64;
    recipient as Bytes112;

record Newsletter:
    owner as address.private;
    op as address.private;
    id as field.private;
    member_sequence as u128.private;
    base as boolean.private;
    revision as boolean.private;
    title as Bytes64.private;
    template as Bytes64.private;
    content as Bytes64.private;
    group_secret as u128.private;
    individual_secret as u128.private;

record Subscription:
    owner as address.private;
    op as address.private;
    id as field.private;
    member_sequence as u128.private;
    member_secret_idx as field.private;


mapping newsletter_member_sequence:
	key left as field.public;
	value right as u128.public;


mapping member_secrets:
	key left as field.public;
	value right as SharedSecret.public;

closure cantors_pairing:
    input r0 as u128;
    input r1 as u128;
    add r0 r1 into r2;
    add r0 r1 into r3;
    add r3 1u128 into r4;
    mul r2 r4 into r5;
    div r5 2u128 into r6;
    add r6 r1 into r7;
    output r7 as u128;


function main:
    input r0 as Bytes64.private;
    input r1 as Bytes64.private;
    input r2 as Bytes64.private;
    input r3 as u128.private;
    input r4 as u128.private;
    input r5 as Bytes64.private;
    input r6 as Bytes112.private;
    sub.w 0u128 1u128 into r7;
    div r7 2u128 into r8;
    lte r3 r8 into r9;
    assert.eq r9 true;
    lte r4 r8 into r10;
    assert.eq r10 true;
    hash.bhp256 r3 into r11 as field;    call cantors_pairing r3 1u128 into r12;
    hash.bhp256 r12 into r13 as field;    cast self.caller self.caller r11 1u128 true false r0 r1 r2 r3 r4 into r14 as Newsletter.record;
    output r14 as Newsletter.record;

    finalize r11 1u128 r13 r5 r6;

finalize main:
    input r0 as field.public;
    input r1 as u128.public;
    input r2 as field.public;
    input r3 as Bytes64.public;
    input r4 as Bytes112.public;
    is.eq r1 1u128 into r5;
    assert.eq r5 true;
    get.or_use newsletter_member_sequence[r0] 0u128 into r6;
    is.eq r6 0u128 into r7;
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
    is.eq r13.shared_secret r8 into r14;
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
    add r0.member_sequence 1u128 into r4;
    cast self.caller r0.op r0.id r4 true false r0.title r0.template r0.content r0.group_secret r0.individual_secret into r5 as Newsletter.record;
    cast r1 r0.op r0.id r4 true false r0.title r0.template r0.content r0.group_secret 0u128 into r6 as Newsletter.record;
    output r5 as Newsletter.record;
    output r6 as Newsletter.record;

    finalize r0.id r4;

finalize invite:
    input r0 as field.public;
    input r1 as u128.public;
    get.or_use newsletter_member_sequence[r0] 0u128 into r2;
    is.neq r2 0u128 into r3;
    assert.eq r3 true;
    set r1 into newsletter_member_sequence[r0];


function accept:
    input r0 as Newsletter.record;
    input r1 as u128.private;
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
    call cantors_pairing r0.group_secret r0.member_sequence into r8;
    hash.bhp256 r8 into r9 as field;    cast self.caller r0.op r0.id r0.member_sequence true false r0.title r0.template r0.content r0.group_secret r1 into r10 as Newsletter.record;
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
    is.eq r8.shared_secret r3 into r9;
    assert.eq r9 true;
    is.eq r8.recipient r4 into r10;
    assert.eq r10 true;
    cast r1 r2 into r11 as SharedSecret;
    set r11 into member_secrets[r0];


function deliver:
    input r0 as Newsletter.record;
    input r1 as Bytes64.private;
    input r2 as Bytes64.private;
    input r3 as address.private;
    is.eq r0.owner self.caller into r4;
    assert.eq r4 true;
    is.eq r0.base true into r5;
    assert.eq r5 true;
    is.eq r0.revision false into r6;
    assert.eq r6 true;
    cast self.caller r0.op r0.id r0.member_sequence r0.base r0.revision r0.title r0.template r0.content r0.group_secret r0.individual_secret into r7 as Newsletter.record;
    cast r3 r0.op r0.id r0.member_sequence false true r1 r0.template r2 r0.group_secret 0u128 into r8 as Newsletter.record;
    output r7 as Newsletter.record;
    output r8 as Newsletter.record;


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
    is.neq r4.shared_secret r1 into r5;
    assert.eq r5 true;
    is.neq r4.recipient r2 into r6;
    assert.eq r6 true;
    cast r1 r2 into r7 as SharedSecret;
    set r7 into member_secrets[r0];
`;
