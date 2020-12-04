import * as path from 'path'
import * as express from 'express'

const app = express()
const DIST_DIR = __dirname
const HTML_FILE = path.join(DIST_DIR, 'index.html')

app.use((req, res, next) => {
    // if "http"
    if (req.headers['x-forwarded-proto'] !== 'https') {
        var split = req.headers.host.split(".")
        
        // format: www.pekora-march.com
        if (split.length === 3 && split[0] === "www") {
            return res.redirect('https://' + req.headers.host + req.url)
        } else if (split.length === 2) {
            return res.redirect('https://www.' + req.headers.host + req.url)
        // any other format, just return as-is
        } else {
            next()
        }
    // if "https"
    } else {
        var split = req.headers.host.split(".")
        console.log(split)
        
        // format: pekora-march.com
        if (split.length === 2) {
            return res.redirect('https://www.' + req.headers.host + req.url)
        // any other format, just return as-is
        } else {
            next()
        }
    }
})

app.use(express.static(DIST_DIR))

app.get('*', (req, res) => {
    res.sendFile(HTML_FILE)
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
    console.log(`App listening to ${PORT}....`)
    console.log('Press Ctrl+C to quit.')
})