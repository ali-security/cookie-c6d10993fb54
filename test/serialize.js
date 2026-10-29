// builtin
var assert = require('assert');

var cookie = require('..');

suite('serialize');

test('basic', function() {
  assert.equal('foo=bar', cookie.serialize('foo', 'bar'));
  assert.equal('foo=bar%20baz', cookie.serialize('foo', 'bar baz'));
  assert.equal('foo=', cookie.serialize('foo', ''));
  assert.throws(cookie.serialize.bind(cookie, 'foo\n', 'bar'), /argument name is invalid/);
  assert.throws(cookie.serialize.bind(cookie, 'foo\u280a', 'bar'), /argument name is invalid/);
  assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {encode: 42}), /option encode is invalid/);
});

test('valid name with extended characters', function() {
  assert.equal('foo/bar=baz', cookie.serialize('foo/bar', 'baz'));
  assert.equal('foo@bar=baz', cookie.serialize('foo@bar', 'baz'));
  assert.equal('foo:bar=baz', cookie.serialize('foo:bar', 'baz'));
});

test('invalid name', function() {
  var invalidNames = [
    'foo\n',
    'foo' + String.fromCharCode(0x280a),
    'foo bar',
    'foo\tbar',
    'foo;bar',
    'foo=bar',
    'foo' + String.fromCharCode(0xe9)
  ];

  for (var i = 0; i < invalidNames.length; i++) {
    assert.throws(cookie.serialize.bind(cookie, invalidNames[i], 'bar'),
      /argument name is invalid/);
  }
});

test('name that injects cookie attributes', function() {
  assert.throws(cookie.serialize.bind(cookie, 'foo; Max-Age=0', 'bar'),
    /argument name is invalid/);
  assert.throws(cookie.serialize.bind(cookie, 'foo; Domain=evil.example.com', 'bar'),
    /argument name is invalid/);
});

test('path', function() {
  assert.equal('foo=bar; Path=/', cookie.serialize('foo', 'bar', {
    path: '/'
  }));

  assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
    path: '/\n'
  }), /option path is invalid/);
});

test('valid path', function() {
  var validPaths = [
    '/',
    '/login',
    '/foo.bar/baz',
    '/foo-bar',
    '/foo=bar?baz',
    '/../foo/bar',
    '../foo/',
    './'
  ];

  for (var i = 0; i < validPaths.length; i++) {
    assert.equal('foo=bar; Path=' + validPaths[i], cookie.serialize('foo', 'bar', {
      path: validPaths[i]
    }));
  }
});

test('invalid path', function() {
  var invalidPaths = [
    '/\n',
    '/foo\tbar',
    '/foo' + String.fromCharCode(0),
    '/foo;bar',
    '/foo; Domain=evil.example.com',
    '/foo; Secure',
    '/foo<bar',
    '/foo' + String.fromCharCode(0xe9)
  ];

  for (var i = 0; i < invalidPaths.length; i++) {
    assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
      path: invalidPaths[i]
    }), /option path is invalid/);
  }
});

test('secure', function() {
  assert.equal('foo=bar; Secure', cookie.serialize('foo', 'bar', {
    secure: true
  }));

  assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
    secure: false
  }));
});

test('domain', function() {
  assert.equal('foo=bar; Domain=example.com', cookie.serialize('foo', 'bar', {
    domain: 'example.com'
  }));

  assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
    domain: 'example.com\n'
  }), /option domain is invalid/);
});

test('valid domain', function() {
  var validDomains = [
    'example.com',
    'sub.example.com',
    '.example.com',
    'localhost',
    '.localhost',
    'my-site.org',
    'sub.example-site.com',
    'sub.sub.example.com',
    'example123.com'
  ];

  for (var i = 0; i < validDomains.length; i++) {
    assert.equal('foo=bar; Domain=' + validDomains[i], cookie.serialize('foo', 'bar', {
      domain: validDomains[i]
    }));
  }
});

test('invalid domain', function() {
  var invalidDomains = [
    'example.com\n',
    'sub.example.com' + String.fromCharCode(0),
    'example.com ',
    ' example.com',
    'my site.org',
    'domain..com',
    'example.com.',
    '-example.com',
    'example.com; Path=/',
    'example.com; Secure',
    'example.com /* inject a comment */',
    'example.com"',
    'exa_mple.com'
  ];

  for (var i = 0; i < invalidDomains.length; i++) {
    assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
      domain: invalidDomains[i]
    }), /option domain is invalid/);
  }
});

test('httpOnly', function() {
  assert.equal('foo=bar; HttpOnly', cookie.serialize('foo', 'bar', {
    httpOnly: true
  }));
});

test('maxAge', function() {
  assert.throws(function () {
    cookie.serialize('foo', 'bar', {
      maxAge: 'buzz'
    });
  }, /option maxAge is invalid/)

  assert.throws(function () {
    cookie.serialize('foo', 'bar', {
      maxAge: Infinity
    })
  }, /option maxAge is invalid/)

  assert.equal('foo=bar; Max-Age=1000', cookie.serialize('foo', 'bar', {
    maxAge: 1000
  }));

  assert.equal('foo=bar; Max-Age=1000', cookie.serialize('foo', 'bar', {
    maxAge: '1000'
  }));

  assert.equal('foo=bar; Max-Age=0', cookie.serialize('foo', 'bar', {
    maxAge: 0
  }));

  assert.equal('foo=bar; Max-Age=0', cookie.serialize('foo', 'bar', {
    maxAge: '0'
  }));

  assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
    maxAge: null
  }));

  assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
    maxAge: undefined
  }));

  assert.equal('foo=bar; Max-Age=3', cookie.serialize('foo', 'bar', {
    maxAge: 3.14
  }));
});

test('expires', function() {
  assert.equal('foo=bar; Expires=Sun, 24 Dec 2000 10:30:59 GMT', cookie.serialize('foo', 'bar', {
    expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900))
  }));

  assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
    expires: Date.now()
  }), /option expires is invalid/);
});

test('sameSite', function() {
  assert.equal('foo=bar; SameSite=Strict', cookie.serialize('foo', 'bar', {
    sameSite: true
  }));

  assert.equal('foo=bar; SameSite=Strict', cookie.serialize('foo', 'bar', {
    sameSite: 'Strict'
  }));

  assert.equal('foo=bar; SameSite=Strict', cookie.serialize('foo', 'bar', {
    sameSite: 'strict'
  }));

  assert.equal('foo=bar; SameSite=Lax', cookie.serialize('foo', 'bar', {
    sameSite: 'Lax'
  }));

  assert.equal('foo=bar; SameSite=Lax', cookie.serialize('foo', 'bar', {
    sameSite: 'lax'
  }));

  assert.equal('foo=bar; SameSite=None', cookie.serialize('foo', 'bar', {
    sameSite: 'None'
  }));

  assert.equal('foo=bar; SameSite=None', cookie.serialize('foo', 'bar', {
    sameSite: 'none'
  }));

  assert.equal('foo=bar', cookie.serialize('foo', 'bar', {
    sameSite: false
  }));

  assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
    sameSite: 'foo'
  }), /option sameSite is invalid/);
});

test('escaping', function() {
  assert.deepEqual('cat=%2B%20', cookie.serialize('cat', '+ '));
});

test('parse->serialize', function() {

  assert.deepEqual({ cat: 'foo=123&name=baz five' }, cookie.parse(
    cookie.serialize('cat', 'foo=123&name=baz five')));

  assert.deepEqual({ cat: ' ";/' }, cookie.parse(
    cookie.serialize('cat', ' ";/')));
});

test('unencoded', function() {
  assert.deepEqual('cat=+', cookie.serialize('cat', '+', {
    encode: function(value) { return value; }
  }));

  assert.throws(cookie.serialize.bind(cookie, 'cat', '+ \n', {
    encode: function(value) { return value; }
  }), /argument val is invalid/);
})

test('unencoded valid values with extended characters', function() {
  assert.deepEqual('foo=foo,bar', cookie.serialize('foo', 'foo,bar', {
    encode: function(value) { return value; }
  }));

  assert.deepEqual('foo=foo\\bar', cookie.serialize('foo', 'foo\\bar', {
    encode: function(value) { return value; }
  }));
})

test('unencoded invalid value', function() {
  var invalidValues = [
    'foo bar',
    'foo\tbar',
    'foo' + String.fromCharCode(0xe9)
  ];

  for (var i = 0; i < invalidValues.length; i++) {
    assert.throws(cookie.serialize.bind(cookie, 'foo', invalidValues[i], {
      encode: function(value) { return value; }
    }), /argument val is invalid/);
  }
})

test('unencoded value that injects cookie attributes', function() {
  assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar; Domain=evil.example.com', {
    encode: function(value) { return value; }
  }), /argument val is invalid/);

  assert.throws(cookie.serialize.bind(cookie, 'foo', 'bar; HttpOnly', {
    encode: function(value) { return value; }
  }), /argument val is invalid/);
})
