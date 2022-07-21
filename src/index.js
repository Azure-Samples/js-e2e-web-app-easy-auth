import 'dotenv/config'
import appInsights from 'applicationinsights';

import { create } from './server.js';

appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING).start()
.setAutoDependencyCorrelation(true)
.setAutoCollectRequests(true)
.setAutoCollectPerformance(true, true)
.setAutoCollectExceptions(true)
.setAutoCollectDependencies(true)
.setAutoCollectConsole(true, false)
.setUseDiskRetryCaching(true)
.setAutoCollectPreAggregatedMetrics(true)
.setSendLiveMetrics(false)
.setAutoCollectHeartbeat(false)
.setInternalLogging(false, true)
.start();

const port = process.env.WEB_PORT || 8080;
let client = appInsights.defaultClient;

create(client)
.then(app => {
    app.listen(port, () => {
        console.log(`Server has started on port ${port}!`);
    }); 
}).catch(err => console.log(err));