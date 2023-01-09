import * as express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core'
import * as fs from 'fs'
import * as https from 'https'
import * as http from 'http'
import { createContext } from './context'
import { schema } from './schema'

require('dotenv').config()

const exec = require('child_process').exec

const SERVER_NAME = process.env.SERVER_NAME || 'localhost'

function getVhostsSSL() {
  return new Promise((resolve, reject) => {
    let dir = exec(
      'whmapi1 --output=jsonpretty fetch_vhost_ssl_components',
      function (err, stdout, stderr) {
        if (err || stderr) {
          reject(err || stderr)
        } else {
          resolve(stdout)
        }
      },
    )
  })
}

async function getSSL() {
  try {
    let result = await getVhostsSSL()
    if (result) {
      let json = JSON.parse(result)
      let found = json.data?.components?.find(
        (host) => host?.servername === SERVER_NAME,
      )
      if (found?.key_id && found?.certificate_id) {
        let key = `/home/ssl/keys/${found?.key_id}.key`
        let cert = `/home/ssl/certs/${found?.certificate_id}.crt`
        return { key, cert }
      }
    }
  } catch (e) {
    console.log(e)
  }
}

async function startApolloServer() {
  const configurations = {
    // Note: You may need sudo to run on port 443
    production: {
      ssl: false, // TODO: - change to true only for now false
      port: process.env.PORT,
      hostname: SERVER_NAME,
    },
    development: { ssl: false, port: process.env.PORT, hostname: 'localhost' },
  }

  const environment = process.env.NODE_ENV || 'production'
  const config = configurations[environment]

  const server = new ApolloServer({
    schema,
    context: createContext,
    introspection: true,
    csrfPrevention: true,
    apollo: { graphId: process.env.APOLLO_GRAPH_ID },
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
    cache: 'bounded',
  })

  await server.start()

  const app = express()
  server.applyMiddleware({ app })

  // Create the HTTPS or HTTP server, per configuration
  let httpServer
  if (config.ssl) {
    // Assumes certificates are in a .ssl folder off of the package root.
    // Make sure these files are secured.

    const {key, cert} = await getSSL() || {}

    if (key && cert) {
      httpServer = https.createServer(
        {
          key: fs.readFileSync(key),
          cert: fs.readFileSync(cert),
        },

        app,
      )
    } else {
      httpServer = http.createServer(app)
    }
  } else {
    httpServer = http.createServer(app)
  }

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: config.port }, resolve),
  )

  console.log(
    '🚀 Server ready at',
    `http${config.ssl ? 's' : ''}://${config.hostname}:${config.port}${
      server.graphqlPath
    }`,
  )

  return { server, app }
}

startApolloServer()
