## Video Explanation

- **Part1:** [https://www.loom.com/share/119b488a0b094885b2b5e62cf610fab9](https://www.loom.com/share/119b488a0b094885b2b5e62cf610fab9)
- **Part2:** [https://www.loom.com/share/12db25ec945942ceab49280bc88e551f](https://www.loom.com/share/12db25ec945942ceab49280bc88e551f)

Hi, here is the approach to solve the problem:
For this requirements, we will use rabbitmq for queue service, mongodb for datastorage, and Node js built in job scheduler to pick up tasks:
Here is the flow:

1.  User creates a post request at localhost:3000/api/submit
    with this payload:
    `{
"url": "https://example.com/article",
"text": "Long content to summarize..."
}`
    To fetch the article content from url, we will use`@extractus/article-extractor`,

2.  The endpoint receives the payload and we will check if we have the results in redis for the exact url or text
    -(Yes) Push the results into collection with status 2, with the summary from redis
    - (No) Creates a object in collection with status 0 and `isRedis:false`
      In both the cases, it will return the api response
      `
      {

"job_id": "abc123",

"status": "queued"/"completed"

}
`

To process the items with status 0: 3. We will setup a cron scheduled to run every second, it will pick up all the items from collection with status 0 and push it to queue(RabbitMq)

4. We will setup a consumer and a producer for rabbitmq queue processing
5. The producer will pick up each item from queue and process the result using openai api, when it receives the response from api, it will add the item to redis colelction and save the details in mongoose collection

Along this ,
the apis:

Status:

GET /status/abc123

{

"job_id": "abc123",

"status": "completed", // queued | processing | completed | failed

"created_at": "2024-01-15T10:00:00Z"

}

Result:

GET /result/abc123

{

"job_id": "abc123",

"original_url": "https://example.com/article",

"summary": "This article discusses...",

"cached": false,

"processing_time_ms": 2340

}

These apis will just return the relevant information from collection
