
# email-exists

**Check whether an email address exists.**

This module checks whether an email address exists by connecting to the mail server and pretending to send an email (*but not actually sending it, of course*).

For checking whether an email is syntactically valid, please use [`hapijs/isemail`](https://github.com/hapijs/isemail).

## Installation

```
npm install email-exists
```

## Quickstart

```js

const emailExists = require('email-exists')

emailExists({ sender: 'darthvader@gmail.com',
              recipient: 'lukeskywalker@gmail.com' })
    .then(console.log)
    // --> MAY_EXIST

```

## API

### `emailExists(options)`

- requires an **options** `<Object>` with the following properties:
    - **sender** `<String>`: *required*; the sender's email address for the `MAIL FROM` command
    - **recipient** `<String>`: *required*; the recipient's email address for the `RCPT TO` command
    - **timeout** `<Number>`: *default =* `3000`; the timeout in milliseconds for the Telnet connection
    - **debug** `<Boolean>`: *default =* `false`; whether to print debug messages to the console
- **returns** a `<Promise>` which:
    - **resolves** with one of the following `<String>` objects:
        - `INVALID_SYNTAX`: Represents a [`553`](https://tools.ietf.org/html/rfc5321#section-4.2.3) indicating that the mailbox name is not allowed due to invalid syntax
        - `NOT_FOUND`: Represents a [`550`](https://tools.ietf.org/html/rfc5321#section-4.2.3) indicating that the mailbox is unavailable,
        cannot be found, or may not be accessed
        - `MAY_EXIST`: To prevent clients from discovering all available addresses, servers may respond with false positives; therefore, this result is deliberately named "may exist", indicating that it is highly likely that the address actually exists, but that it cannot be confirmed (without actually sending a confirmation mail)
    - **rejects** with an `<Error>` object if either the DNS lookup or the Telnet connection fails

## Todos

- Support for nested comments
- Support for IPv4 and IPv6 address literals

## License

[WTFPL](http://www.wtfpl.net/) – Do What the F*ck You Want to Public License.

Made with :heart: by [@MarkTiedemann](https://twitter.com/MarkTiedemannDE).
