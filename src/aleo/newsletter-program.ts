export const NewsletterProgramId = 'newsletter_v2.aleo';

export const NewsletterProgram = `program newsletter_v2.aleo;

struct Bytes160:
    b0 as u128;
    b1 as u128;
    b2 as u128;
    b3 as u128;
    b4 as u128;
    b5 as u128;
    b6 as u128;
    b7 as u128;
    b8 as u128;
    b9 as u128;

struct SharedSecret:
    shared_secret as Bytes160;
    recipient as Bytes160;

record Newsletter:
    owner as address.private;
    op as address.private;
    id as field.private;
    member_sequence as u64.private;
    base as boolean.private;
    revision as boolean.private;
    title as Bytes160.private;
    template as Bytes160.private;
    content as Bytes160.private;
    group_secret as u64.private;
    individual_secret as u64.private;

record Subscription:
    owner as address.private;
    op as address.private;
    id as field.private;
    member_sequence as u64.private;
    member_secret_idx as field.private;


mapping newsletter_member_sequence:
	key left as field.public;
	value right as u64.public;


mapping member_secrets:
	key left as field.public;
	value right as SharedSecret.public;

closure cantors_pairing:
    input r0 as u64;
    input r1 as u64;
    add r0 r1 into r2;
    add r0 r1 into r3;
    add r3 1u64 into r4;
    mul r2 r4 into r5;
    div r5 2u64 into r6;
    add r6 r1 into r7;
    output r7 as u64;


function main:
    input r0 as Bytes160.private;
    input r1 as Bytes160.private;
    input r2 as Bytes160.private;
    input r3 as u64.private;
    input r4 as u64.private;
    input r5 as Bytes160.private;
    input r6 as Bytes160.private;
    hash.bhp256 r3 into r7 as field;    call cantors_pairing r3 1u64 into r8;
    hash.bhp256 r8 into r9 as field;    cast self.caller self.caller r7 1u64 true false r0 r1 r2 r3 r4 into r10 as Newsletter.record;
    output r10 as Newsletter.record;

    finalize r7 1u64 r9 r5 r6;

finalize main:
    input r0 as field.public;
    input r1 as u64.public;
    input r2 as field.public;
    input r3 as Bytes160.public;
    input r4 as Bytes160.public;
    is.eq r1 1u64 into r5;
    assert.eq r5 true;
    get.or_use newsletter_member_sequence[r0] 0u64 into r6;
    is.eq r6 0u64 into r7;
    assert.eq r7 true;
    set r1 into newsletter_member_sequence[r0];
    cast 0u128 0u128 0u128 0u128 0u128 0u128 0u128 0u128 0u128 0u128 into r8 as Bytes160;
    is.neq r3 r8 into r9;
    assert.eq r9 true;
    is.neq r4 r8 into r10;
    assert.eq r10 true;
    cast r8 r8 into r11 as SharedSecret;
    get.or_use member_secrets[r2] r11 into r12;
    is.eq r12.shared_secret r8 into r13;
    assert.eq r13 true;
    is.eq r12.recipient r8 into r14;
    assert.eq r14 true;
    cast r3 r4 into r15 as SharedSecret;
    set r15 into member_secrets[r2];


function invite:
    input r0 as Newsletter.record;
    input r1 as address.private;
    is.eq r0.owner self.caller into r2;
    assert.eq r2 true;
    is.eq r0.op self.caller into r3;
    assert.eq r3 true;
    add r0.member_sequence 1u64 into r4;
    cast self.caller r0.op r0.id r4 true false r0.title r0.template r0.content r0.group_secret r0.individual_secret into r5 as Newsletter.record;
    cast r1 r0.op r0.id r4 true false r0.title r0.template r0.content r0.group_secret 0u64 into r6 as Newsletter.record;
    output r5 as Newsletter.record;
    output r6 as Newsletter.record;

    finalize r0.id r4;

finalize invite:
    input r0 as field.public;
    input r1 as u64.public;
    get.or_use newsletter_member_sequence[r0] 0u64 into r2;
    is.neq r2 0u64 into r3;
    assert.eq r3 true;
    set r1 into newsletter_member_sequence[r0];


function accept:
    input r0 as Newsletter.record;
    input r1 as u64.private;
    input r2 as Bytes160.private;
    input r3 as Bytes160.private;
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
    input r1 as Bytes160.public;
    input r2 as Bytes160.public;
    cast 0u128 0u128 0u128 0u128 0u128 0u128 0u128 0u128 0u128 0u128 into r3 as Bytes160;
    is.neq r1 r3 into r4;
    assert.eq r4 true;
    is.neq r2 r3 into r5;
    assert.eq r5 true;
    cast r3 r3 into r6 as SharedSecret;
    get.or_use member_secrets[r0] r6 into r7;
    is.eq r7.shared_secret r3 into r8;
    assert.eq r8 true;
    is.eq r7.recipient r3 into r9;
    assert.eq r9 true;
    cast r1 r2 into r10 as SharedSecret;
    set r10 into member_secrets[r0];


function deliver:
    input r0 as Newsletter.record;
    input r1 as Bytes160.private;
    input r2 as Bytes160.private;
    input r3 as address.private;
    is.eq r0.owner self.caller into r4;
    assert.eq r4 true;
    is.eq r0.base true into r5;
    assert.eq r5 true;
    is.eq r0.revision false into r6;
    assert.eq r6 true;
    cast self.caller r0.op r0.id r0.member_sequence r0.base r0.revision r0.title r0.template r0.content r0.group_secret r0.individual_secret into r7 as Newsletter.record;
    cast r3 r0.op r0.id r0.member_sequence false true r1 r0.template r2 r0.group_secret 0u64 into r8 as Newsletter.record;
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
    cast 0u128 0u128 0u128 0u128 0u128 0u128 0u128 0u128 0u128 0u128 into r1 as Bytes160;
    cast r1 r1 into r2 as SharedSecret;
    get.or_use member_secrets[r0] r2 into r3;
    is.neq r3.shared_secret r1 into r4;
    assert.eq r4 true;
    is.neq r3.recipient r1 into r5;
    assert.eq r5 true;
    cast r1 r1 into r6 as SharedSecret;
    set r6 into member_secrets[r0];
`;
