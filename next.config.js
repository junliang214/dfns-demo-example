const dotenv = require('dotenv')

const nextConfig = {
  env: {
    ...dotenv.config({ path: '.env' }).parsed,
    ...dotenv.config({ path: '.env.local' }).parsed,
  },
  transpilePackages: ['@dfns/sdk', '@dfns/sdk-browser', '@dfns/sdk-keysigner'],
}

module.exports = nextConfig
