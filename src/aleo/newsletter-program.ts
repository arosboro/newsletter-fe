export const NewsletterProgramId = 'newsletter_v1.aleo';

export const NewsletterProgram = `program newsletter_v1.aleo;

struct SharedSecret:
    shared_secret as u64;
    recipient as u128;

record Newsletter:
    owner as address.private;
    op as address.private;
    id as field.private;
    member_sequence as u64.private;
    base as boolean.private;
    revision as boolean.private;
    title as u128.private;
    template as u128.private;
    content as u128.private;
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
    input r0 as u128.private;
    input r1 as u128.private;
    input r2 as u128.private;
    input r3 as u64.private;
    input r4 as u64.private;
    input r5 as u64.private;
    input r6 as u128.private;
    hash.bhp256 r3 into r7 as field;    call cantors_pairing r3 1u64 into r8;
    hash.bhp256 r8 into r9 as field;    cast self.caller self.caller r7 1u64 true false r0 r1 r2 r3 r4 into r10 as Newsletter.record;
    output r10 as Newsletter.record;

    finalize r7 1u64 r9 r5 r6;

finalize main:
    input r0 as field.public;
    input r1 as u64.public;
    input r2 as field.public;
    input r3 as u64.public;
    input r4 as u128.public;
    is.eq r1 1u64 into r5;
    assert.eq r5 true;
    get.or_use newsletter_member_sequence[r0] 0u64 into r6;
    is.eq r6 0u64 into r7;
    assert.eq r7 true;
    set r1 into newsletter_member_sequence[r0];
    is.neq r3 0u64 into r8;
    assert.eq r8 true;
    is.neq r4 0u128 into r9;
    assert.eq r9 true;
    cast 0u64 0u128 into r10 as SharedSecret;
    get.or_use member_secrets[r2] r10 into r11;
    is.eq r11.shared_secret 0u64 into r12;
    assert.eq r12 true;
    is.eq r11.recipient 0u128 into r13;
    assert.eq r13 true;
    cast r3 r4 into r14 as SharedSecret;
    set r14 into member_secrets[r2];


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
    input r2 as u64.private;
    input r3 as u128.private;
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
    input r1 as u64.public;
    input r2 as u128.public;
    is.neq r1 0u64 into r3;
    assert.eq r3 true;
    is.neq r2 0u128 into r4;
    assert.eq r4 true;
    cast 0u64 0u128 into r5 as SharedSecret;
    get.or_use member_secrets[r0] r5 into r6;
    is.eq r6.shared_secret 0u64 into r7;
    assert.eq r7 true;
    is.eq r6.recipient 0u128 into r8;
    assert.eq r8 true;
    cast r1 r2 into r9 as SharedSecret;
    set r9 into member_secrets[r0];


function deliver:
    input r0 as Newsletter.record;
    input r1 as u128.private;
    input r2 as u128.private;
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
    cast 0u64 0u128 into r1 as SharedSecret;
    get.or_use member_secrets[r0] r1 into r2;
    is.neq r2.shared_secret 0u64 into r3;
    assert.eq r3 true;
    is.neq r2.recipient 0u128 into r4;
    assert.eq r4 true;
    cast 0u64 0u128 into r5 as SharedSecret;
    set r5 into member_secrets[r0];
`;
