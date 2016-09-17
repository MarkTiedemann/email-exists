
const emailExists = require('.')

emailExists({ sender: 'darthvader@gmail.com',
              recipient: 'lukeskywalker@gmail.com' })
    .then(console.log)
    .catch(console.error)
    // --> MAY_EXIST
