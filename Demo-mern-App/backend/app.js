const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const errorMiddleware = require('./middlewares/error');
const Prometheus = require('prom-client');

const app = express();

// Config
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: 'backend/config/config.env' });
}

const metricsInterval = Prometheus.collectDefaultMetrics();

const httpRequestDurationMicroseconds = new Prometheus.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.10, 5, 15, 50, 100, 200, 300, 400, 500]
});

const httpRequestCounter = new Prometheus.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'code']
});

const httpErrorCounter = new Prometheus.Counter({
    name: 'http_errors_total',
    help: 'Total number of HTTP errors',
    labelNames: ['method', 'route']
});

const cpuUsageGauge = new Prometheus.Gauge({
    name: 'cpu_usage_percent',
    help: 'Current CPU usage as a percentage'
});


const memoryUsageGauge = new Prometheus.Gauge({
    name: 'memory_usage_bytes',
    help: 'Current memory usage in bytes'
});

app.use((req, res, next) => {
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();

   
    cpuUsageGauge.set(getCPUUsagePercentage(cpuUsage));

 
    memoryUsageGauge.set(memoryUsage.heapUsed);

    next();
});

// Helper function to calculate CPU usage percentage
function getCPUUsagePercentage(cpuUsage) {
    const totalUsage = cpuUsage.user + cpuUsage.system;
    const totalElapsedTime = process.uptime() * 1000; // in milliseconds
    const usagePercentage = (totalUsage / totalElapsedTime) * 100;
    return usagePercentage;
}

app.use((req, res, next) => {
    res.locals.startEpoch = Date.now();
    next();
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', Prometheus.register.contentType);
    const metrics = await Prometheus.register.metrics();
    res.end(metrics);
});

// Error handler
app.use((err, req, res, next) => {
    res.statusCode = 500;
    const routePath = req.originalUrl;
    httpErrorCounter.labels(req.method, routePath).inc();
    res.json({ error: err.message });
});

// Middleware to record response time and count requests
app.use((req, res, next) => {
    const responseTimeInMs = Date.now() - res.locals.startEpoch;

    // Using req.originalUrl to capture the route path
    const routePath = req.originalUrl;

    httpRequestDurationMicroseconds
        .labels(req.method, routePath, res.statusCode)
        .observe(responseTimeInMs);

    httpRequestCounter.labels(req.method, routePath, res.statusCode).inc();

    next();
});


// Graceful shutdown
process.on('SIGTERM', () => {
    clearInterval(metricsInterval);

    server.close((err) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }

        process.exit(0);
    });
});

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

const user = require('./routes/userRoute');
const product = require('./routes/productRoute');
const order = require('./routes/orderRoute');
const payment = require('./routes/paymentRoute');

app.use('/api/v1', user);
app.use('/api/v1', product);
app.use('/api/v1', order);
app.use('/api/v1', payment);

// deployment
__dirname = path.resolve();
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '/frontend/build')))

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
    });
} else {
    app.get('/', (req, res) => {
        res.send('Server is Running! 🚀');
    });
}

// error middleware
app.use(errorMiddleware);

module.exports = app;












































// const express = require('express');
// const path = require('path');
// const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
// const fileUpload = require('express-fileupload');
// const errorMiddleware = require('./middlewares/error');

// const app = express();

// // config
// if (process.env.NODE_ENV !== 'production') {
//     require('dotenv').config({ path: 'backend/config/config.env' });
// }

// app.use(express.json());
// app.use(cookieParser());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(fileUpload());

// const user = require('./routes/userRoute');
// const product = require('./routes/productRoute');
// const order = require('./routes/orderRoute');
// const payment = require('./routes/paymentRoute');

// app.use('/api/v1', user);
// app.use('/api/v1', product);
// app.use('/api/v1', order);
// app.use('/api/v1', payment);

// // deployment
// __dirname = path.resolve();
// if (process.env.NODE_ENV === 'production') {
//     app.use(express.static(path.join(__dirname, '/frontend/build')))

//     app.get('*', (req, res) => {
//         res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
//     });
// } else {
//     app.get('/', (req, res) => {
//         res.send('Server is Running! 🚀');
//     });
// }

// // error middleware
// app.use(errorMiddleware);

// module.exports = app;