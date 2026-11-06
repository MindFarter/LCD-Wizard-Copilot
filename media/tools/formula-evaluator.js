'use strict';

const FUNCTIONS = Object.freeze(Object.assign(Object.create(null), {
  abs: Math.abs,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  sqrt: Math.sqrt,
  log: Math.log,
  exp: Math.exp,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  atan2: Math.atan2,
  hypot: Math.hypot,
  pow: Math.pow,
  min: Math.min,
  max: Math.max,
  degrees: (radians) => radians * 180 / Math.PI,
  radians: (degrees) => degrees * Math.PI / 180,
  map: (value, inLow, inHigh, outLow, outHigh) => {
    if (inLow === inHigh) throw new Error('map input limits must differ.');
    return (value - inLow) * (outHigh - outLow) / (inHigh - inLow) + outLow;
  },
  constrain: (value, low, high) => Math.min(Math.max(value, low), high),
  clamp: (value, low, high) => Math.min(Math.max(value, low), high),
  random: (low, high) => Math.floor(Math.random() * (Math.abs(high - low) + 1)) + Math.min(low, high)
}));

const PRECEDENCE = Object.freeze({
  '||': 1,
  '&&': 2,
  '==': 3,
  '!=': 3,
  '>': 4,
  '>=': 4,
  '<': 4,
  '<=': 4,
  '+': 5,
  '-': 5,
  '*': 6,
  '/': 6,
  '%': 6
});

function tokenize(source) {
  const tokens = [];
  let index = 0;
  const patterns = [
    /^(?:0x[0-9a-f]+)\b/i,
    /^(?:(?:\d+\.\d*|\.\d+|\d+)(?:e[+-]?\d+)?)/i,
    /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/,
    /^(?:>=|<=|==|!=|&&|\|\||[()+\-*/%><!?:,])/
  ];

  while (index < source.length) {
    if (/\s/.test(source[index])) {
      index += 1;
      continue;
    }
    const rest = source.slice(index);
    let matched = false;
    for (const pattern of patterns) {
      const match = rest.match(pattern);
      if (!match) continue;
      const value = match[0];
      const type = pattern === patterns[0] || pattern === patterns[1] ? 'number'
        : pattern === patterns[2] ? 'identifier' : 'operator';
      tokens.push({ type, value });
      index += value.length;
      matched = true;
      break;
    }
    if (!matched) throw new Error(`Unsupported character “${source[index]}”.`);
  }
  return tokens;
}

function isTruthy(value) {
  return typeof value === 'boolean' ? value : Number(value) !== 0;
}

function evaluate(source, variables = {}, previous = {}) {
  const tokens = tokenize(String(source));
  let position = 0;

  const peek = (value) => tokens[position] && (value ? tokens[position].value === value : true);
  const take = (value) => {
    const token = tokens[position];
    if (!token || (value && token.value !== value)) throw new Error(`Expected “${value || 'more formula'}”.`);
    position += 1;
    return token;
  };

  function primary() {
    if (peek('(')) {
      take('(');
      const value = conditional();
      take(')');
      return value;
    }
    const token = take();
    if (token.type === 'number') return /^0x/i.test(token.value) ? parseInt(token.value.slice(2), 16) : Number(token.value);
    if (token.type !== 'identifier') throw new Error(`Unexpected “${token.value}”.`);
    if (token.value === 'true') return true;
    if (token.value === 'false') return false;

    if (peek('(')) {
      take('(');
      if (token.value === 'prev' || token.value === 'delta') {
        const name = take();
        if (name.type !== 'identifier') throw new Error(`${token.value}() needs a variable name.`);
        take(')');
        if (token.value === 'prev') {
          if (!Object.prototype.hasOwnProperty.call(previous, name.value)) throw new Error(`Add a previous sample for ${name.value}.`);
          return previous[name.value];
        }
        if (!Object.prototype.hasOwnProperty.call(variables, name.value) || !Object.prototype.hasOwnProperty.call(previous, name.value)) {
          throw new Error(`Add current and previous samples for ${name.value}.`);
        }
        return variables[name.value] - previous[name.value];
      }
      if (!Object.prototype.hasOwnProperty.call(FUNCTIONS, token.value)) throw new Error(`Function ${token.value}() is not supported by this tester.`);
      const args = [];
      if (!peek(')')) {
        args.push(conditional());
        while (peek(',')) {
          take(',');
          args.push(conditional());
        }
      }
      take(')');
      if (token.value === 'if') {
        if (args.length !== 3) throw new Error('if() needs three arguments.');
        return isTruthy(args[0]) ? args[1] : args[2];
      }
      return FUNCTIONS[token.value](...args);
    }

    if (!Object.prototype.hasOwnProperty.call(variables, token.value)) {
      throw new Error(`Add a sample value for ${token.value}.`);
    }
    return variables[token.value];
  }

  function unary() {
    if (peek('!')) { take('!'); return !isTruthy(unary()); }
    if (peek('+')) { take('+'); return +unary(); }
    if (peek('-')) { take('-'); return -unary(); }
    return primary();
  }

  function binary(minPrecedence) {
    let left = unary();
    while (peek() && Object.prototype.hasOwnProperty.call(PRECEDENCE, tokens[position].value) && PRECEDENCE[tokens[position].value] >= minPrecedence) {
      const operator = take().value;
      const precedence = PRECEDENCE[operator];
      const right = binary(precedence + 1);
      switch (operator) {
        case '||': left = isTruthy(left) || isTruthy(right); break;
        case '&&': left = isTruthy(left) && isTruthy(right); break;
        case '==': left = left === right; break;
        case '!=': left = left !== right; break;
        case '>': left = left > right; break;
        case '>=': left = left >= right; break;
        case '<': left = left < right; break;
        case '<=': left = left <= right; break;
        case '+': left = Number(left) + Number(right); break;
        case '-': left = Number(left) - Number(right); break;
        case '*': left = Number(left) * Number(right); break;
        case '/': left = Number(left) / Number(right); break;
        case '%': left = Number(left) % Number(right); break;
      }
    }
    return left;
  }

  function conditional() {
    const condition = binary(1);
    if (!peek('?')) return condition;
    take('?');
    const yes = conditional();
    take(':');
    const no = conditional();
    return isTruthy(condition) ? yes : no;
  }

  const result = conditional();
  if (position !== tokens.length) throw new Error(`Unexpected “${tokens[position].value}”.`);
  return result;
}

function variablesIn(source) {
  const tokens = tokenize(String(source));
  const variables = new Set();
  const previous = new Set();
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.type !== 'identifier' || token.value === 'true' || token.value === 'false') continue;
    if (tokens[i + 1] && tokens[i + 1].value === '(') {
      if (token.value === 'prev' || token.value === 'delta') {
        const name = tokens[i + 2];
        if (name && name.type === 'identifier') previous.add(name.value);
        if (token.value === 'delta' && name && name.type === 'identifier') variables.add(name.value);
        i += 2;
      }
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(FUNCTIONS, token.value)) variables.add(token.value);
  }
  return { variables: [...variables], previous: [...previous] };
}

const LCDWizardFormula = Object.freeze({ evaluate, tokenize, variablesIn });
if (typeof module !== 'undefined' && module.exports) module.exports = LCDWizardFormula;
if (typeof window !== 'undefined') window.LCDWizardFormula = LCDWizardFormula;