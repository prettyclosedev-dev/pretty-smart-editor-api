import * as express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core'
import * as fs from 'fs'
import * as https from 'https'
import * as http from 'http'
import { createContext } from './context'
import { schema } from './schema'
import * as basicAuth from 'express-basic-auth'
import * as cors from 'cors'
import * as path from 'path'
import { graphqlUploadExpress } from 'graphql-upload-ts';

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
    apollo: { graphRef: process.env.APOLLO_GRAPH_REF },
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
    cache: 'bounded',
  })

  await server.start()

  const app = express()

  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(express.json({ limit: '50mb' }));
  app.use(cors())
  app.use(graphqlUploadExpress());

  server.applyMiddleware({ app })

  // Create the HTTPS or HTTP server, per configuration
  let httpServer
  if (config.ssl) {
    // Assumes certificates are in a .ssl folder off of the package root.
    // Make sure these files are secured.

    const { key, cert } = (await getSSL()) || {}

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

  server.applyMiddleware({ app })

  // Set up basic authentication
  app.use(
    '/system-role',
    basicAuth({
      users: { prettysmart: '_prettydum_' },
      challenge: true,
      realm: 'System Role Editor',
    }),
  )

  // Serve the editable system-role.txt file
  app.get('/system-role', async (req, res) => {
    try {
      const filePath = path.join(__dirname, '../src/assets/system-role.txt')
      const data = await fs.promises.readFile(filePath, 'utf8')
      res.send(data)
    } catch (err) {
      console.error(err)
      res.status(500).send('An error occurred while reading the file.')
    }
  })

  // Save the edited content
  app.post('/system-role', async (req, res) => {
    const content = req.body.content
    try {
      const filePath = path.join(__dirname, '../src/assets/system-role.txt')
      await fs.promises.writeFile(filePath, content, 'utf8')
      res.status(200).send('File saved successfully.')
    } catch (err) {
      console.error(err)
      res.status(500).send('An error occurred while saving the file.')
    }
  })

  app.get(
    '/edit-system-role',
    basicAuth({
      users: { prettysmart: '_prettydum_' },
      challenge: true,
      realm: 'System Role Editor',
    }),
    async (req, res) => {
      try {
        const filePath = path.join(__dirname, '../src/assets/system-role.txt')
        const data = await fs.promises.readFile(filePath, 'utf8')
        const authHeader = req.get('Authorization');
        const base64Credentials = authHeader?.split(' ')?.[1] || ""
        const [username, password] = Buffer.from(base64Credentials, 'base64').toString('utf8').split(':')
        res.send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Edit System Role</title>
            <style>
              html, body {
                height: 100%;
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
              }
              #edit-form {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
              }
              textarea {
                width: 80%;
                height: 80%;
                padding: 0;
                margin-bottom: 10px;
                box-sizing: border-box;
                resize: none;
                border: 1px solid #ccc;
                font-size: 16px;
              }
              button {
                font-size: 16px;
                padding: 8px 16px;
              }
            </style>
          </head>
          <body>
            <form id="edit-form">
              <textarea id="content">${data}</textarea>
              <button id="save">Save</button>
            </form>
            <script>
              document.getElementById('edit-form').addEventListener('submit', async (event) => {
                event.preventDefault();
                const content = document.getElementById('content').value;
                const credentials = btoa('${username}:${password}');
                const response = await fetch('/system-role', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + credentials
                  },
                  body: JSON.stringify({ content }),
                });
                if (response.ok) {
                  alert('File saved successfully.');
                } else {
                  alert('An error occurred while saving the file.');
                }
              });                    
            </script>
          </body>
          </html>
        `)
      } catch (err) {
        console.error(err)
        res.status(500).send('An error occurred while reading the file.')
      }
    },
  )

  return { server, app }
}

startApolloServer()
