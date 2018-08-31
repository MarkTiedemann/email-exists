'use strict'

const dns = require('dns')
const net = require('net')

/* http://emailregex.com/
   Checking email syntax is not a trivial problem and
   possibly impractical (even a 100%-accurate validation
   does not account for mistakenly typing a valid, but
   wrong address.)
   As-simple-as-possible "real world" email syntax check:
   Check that the address includes at least 1 '@'-sign,
   which is not the last character (so we can extract the
   domain part). No overly-complicated, unmaintainable,
   only 99%-accurate regex needed. Especially since,
   in practice, what is consider valid is a server-side
   decision: So if we later send an invalid address to the
   server (which we looked up with the domain part), and
   the server replies with "553" (invalid syntax), that
   should be the definitive answer. */

const mayBeValidSyntax = email =>
    email.includes('@') && !email.endsWith('@')

const x = require('throw-if-missing')

module.exports = ({

    sender = x`sender`,
    recipient = x`recipient`,
    timeout = 3000,
    debug = false

} = {}) => {

    return new Promise((resolve, reject) => {

        if (!mayBeValidSyntax(sender)) reject('INVALID_SYNTAX')
        else if (!mayBeValidSyntax(recipient)) reject('INVALID_SYNTAX')
        else {

            /* https://en.wikipedia.org/wiki/Email_address#Syntax
               One or more '@'-signs are allowed in the local part inside of
               a quoted string. Therefore, use the last '@'-sign found when
               splitting the address. */

            const split = recipient.split('@')

            let domain = split[split.length - 1]
            let local = split.splice(0, split.length - 1).join('')

            /* Comments may exist at the beginning or the end
               of the domain part, so remove them. */

            // TODO: Implement support for nested comments

            if (domain.startsWith('('))
                domain = domain.substring(domain.indexOf(')') + 1, domain.length)

            if (domain.endsWith(')'))
                domain = domain.substring(0, domain.indexOf('('))

            // TODO: Implement support for IPv4 and IPv6 address literals

            dns.resolveMx(domain, (err, addresses) => {

                if (err) reject(err)
                else {

                    /* https://en.wikipedia.org/wiki/MX_record#Priority
                       The MX priority determines the order in which the servers
                       are supposed to be contacted: The servers with the highest
                       priority (and the lowest preference number) shall be tried
                       first. Node, however, erroneously labels the preference number
                       "priority". Therefore, sort the addresses by priority in
                       ascending order, and then contact the first exchange. */

                    const sortedAddresses = addresses.sort((a, b) => a.priority - b.priority)
                    const exchange = sortedAddresses[0].exchange

                    /* https://technet.microsoft.com/en-us/library/aa995718
                       Since Telnet can be used for testing SMTP, we don't even
                       need an external SMTP library but can simply use Node's
                       built-in net client. */

                    const TELNET_PORT = 25
                    const conn = net.createConnection(TELNET_PORT, exchange)

                    conn.setTimeout(timeout)

                    conn.on('error', reject)

                    conn.on('timeout', () => reject('TIMEOUT'))

                    conn.on('connect', () => {

                        const EOL = '\r\n'

                        conn.write('HELO hi' + EOL)
                        conn.write(`MAIL FROM: <${sender}>` + EOL)
                        conn.write(`RCPT TO: <${local}@${domain}>` + EOL)
                        conn.write('QUIT' + EOL)

                        conn.on('data', data => {

                            const response = data.toString().trim()
                            if (debug) console.log(response)

                            /* https://tools.ietf.org/html/rfc5321#section-4.2.3
                               A "550" indicates that the mailbox is unavailable,
                               cannot be found, or may not be accessed. */

                            if (response.startsWith('550')) resolve('NOT_FOUND')

                            /* https://tools.ietf.org/html/rfc5321#section-4.2.3
                               A "553" indicates that the mailbox name is not allowed
                               due to invalid syntax. (Note: This means that either
                               the sender's or the recipient's email address is invalid.) */

                            if (response.startsWith('553')) resolve('INVALID_SYNTAX')
                        })

                        /* https://tools.ietf.org/html/rfc1123#section-5.2.7
                           Cannot check whether an address actually exists:
                           Servers may send "250 OK" false positives to prevent
                           malware from discovering all available addresses. */

                        conn.on('end', () => resolve('MAY_EXIST'))

                    })
                }
            })
        }
    })

}
