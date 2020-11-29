import * as path from 'path'
import * as express from 'express'

const app = express()
const DIST_DIR = __dirname
const HTML_FILE = path.join(DIST_DIR, 'index.html')

app.use(express.static(DIST_DIR))

app.use((req, res, next) => {
    console.log(req.secure)
    if (req.secure) {
        next()
    } else {
        res.redirect('https://' + req.headers.host + req.url)
    }
})

app.get('*', (req, res) => {
    res.sendFile(HTML_FILE)
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
    console.log(`App listening to ${PORT}....`)
    console.log('Press Ctrl+C to quit.')
})