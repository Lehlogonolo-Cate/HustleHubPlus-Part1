// Rounds to cents so floating-point artefacts such as 0.1 + 0.2 never reach a record
const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

module.exports = { roundMoney };
