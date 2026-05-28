# Prompts.md — AI Transparency Log
## Aura Engine

This document records every significant AI interaction used during the
architecture and development of Aura Engine. As required by the delivery
protocol, this log demonstrates how AI was used as an engineering tool —
not as a copy-paste machine — but as a collaborator to solve specific
technical problems.

---

## Prompt 1 — Designing the MongoDB Aggregation Pipeline

**Problem I was trying to solve:**
The analytics endpoint needed to calculate total inventory value, category
distributions, and restock priorities across 50,000 records. My first
instinct was to fetch all records and calculate in JavaScript. I knew this
was wrong architecturally but needed to understand the correct approach.

**My Prompt:**
> "I have 50,000 product documents in MongoDB. Each document has a price,
> stockQuantity, and category field. I need to calculate three things in
> one API call: total inventory value (price * stockQuantity summed across
> all documents), a breakdown of total value per category, and the top 10
> products with the lowest stock. I know I should NOT fetch all 50,000
> records into Node.js and calculate in JavaScript. How do I write a
> MongoDB aggregation pipeline that does all of this computation inside
> the database and returns only the final results?"

**What I learned from the response:**
The AI explained the difference between a collection scan in JavaScript
versus a database-level aggregation. I learned that `$group` with `$sum`
and `$multiply` runs the arithmetic inside MongoDB's execution engine,
and `Promise.all` can run multiple aggregation pipelines in parallel so
all three calculations complete simultaneously instead of sequentially.

**How I applied it:**
I did not copy the code directly. I used the explanation to write the
three pipelines myself — the category distribution pipeline, the low
stock pipeline using `$match` and `$sort` with `$limit`, and the summary
KPI pipeline using `$group` with `_id: null`. I then added the
`isCritical` computed field using `$cond` myself, which was not in the
AI response, to flag items below their reorder level for the bar chart
colour coding.

**Engineering decision I made independently:**
I chose to run all three aggregations in `Promise.all` rather than
sequentially. This halves the response time because MongoDB processes
them in parallel. The AI did not suggest this — I applied it based on
my understanding of asynchronous JavaScript.

---

## Prompt 2 — Implementing the Debounced Search Hook

**Problem I was trying to solve:**
I needed the search bar to query the database without firing an API call
on every single keystroke. I understood the concept of debouncing but
had not implemented it as a reusable React hook before.

**My Prompt:**
> "I am building a search input in React that calls a backend API. If
> the user types 'wireless headphones', I do not want 18 API calls to
> fire — one for each character. I want to wait until the user stops
> typing for 500ms before making the request. How do I implement this
> as a reusable custom hook called useDebounce that I can import into
> any component?"

**What I learned from the response:**
The AI explained that debouncing works by setting a `setTimeout` inside
a `useEffect`, and the cleanup function returned from `useEffect` clears
the previous timer every time the value changes. This means the timeout
only completes — and the debounced value only updates — when the user
has not typed for the full 500ms window.

**How I applied it:**
I implemented the hook and then extended it with a configurable `delay`
parameter with a default of 500ms, so any component can pass a different
delay if needed. I also connected it to the `useCallback` dependency
array in the Inventory component so the fetch function only re-runs when
the debounced value changes — not the raw input value. This was my own
architectural decision to avoid double-fetching.

---

## Prompt 3 — MongoDB Indexing Strategy for Performance

**Problem I was trying to solve:**
I had seeded 50,000 records but text search was slow. I needed to
understand which fields to index and why, and specifically how MongoDB
text indexes work differently from regular indexes.

**My Prompt:**
> "I have a MongoDB collection with 50,000 product documents. I need to
> support three types of queries efficiently: text search on productName,
> filtering by category, and sorting by price and stockQuantity. What
> indexes should I create and what is the difference between a regular
> index and a text index in MongoDB? Will creating too many indexes hurt
> write performance?"

**What I learned from the response:**
A regular index stores sorted copies of field values and is used for
equality matches and range queries. A text index tokenises string content
and builds an inverted index — like a book's index — that maps words to
the documents containing them. The AI also explained that each additional
index adds overhead to write operations because MongoDB must update every
index on every insert or update.

**How I applied it:**
I created targeted indexes only on fields that are actually queried:
`{ sku: 1 }` for unique lookups, `{ category: 1 }` for filter queries,
`{ productName: 'text' }` for the search bar, and compound-friendly
indexes on `stockQuantity` and `price` for sort operations. I did not
index every field — only the ones used in the query engine. This was a
deliberate trade-off between read performance and write performance.

---

## Prompt 4 — Designing the Seed Script for Realistic Data

**Problem I was trying to solve:**
I needed to generate 50,000 realistic product records. Generating them
one at a time would time out. I needed a batch insertion strategy that
would not crash Node.js memory.

**My Prompt:**
> "I need to insert 50,000 documents into MongoDB using a Node.js seed
> script with faker.js. If I generate all 50,000 objects in memory at
> once and call insertMany, will it crash? What is the correct pattern
> for batch-inserting large datasets in Node.js without running out of
> memory, and how do I show progress so I know the script is still
> running?"

**What I learned from the response:**
Generating 50,000 objects in a single array can consume several hundred
megabytes of memory and potentially cause a heap out of memory error.
The correct pattern is to generate and insert in batches — create 1,000
documents, insert them, release the reference, then repeat. The AI
also explained the `{ ordered: false }` option on `insertMany` which
tells MongoDB to continue inserting remaining documents even if one
document fails validation, rather than aborting the entire batch.

**How I applied it:**
I implemented the batch loop with a batch size of 1,000 and added
console progress logging every batch so the terminal shows
`Inserted 1000 / 50000`, `Inserted 2000 / 50000` and so on. I chose
`ordered: false` to make the seeder resilient to duplicate SKU
collisions. The loop structure and progress logging were written by me —
the AI gave me the conceptual pattern, not the final code.

---

## Prompt 5 — Server-Side Pagination Architecture

**Problem I was trying to solve:**
The client brief said the old system froze the browser trying to load
50,000 rows. I needed to understand the correct architectural pattern
for server-side pagination and what metadata the frontend needs.

**My Prompt:**
> "I am building a GET /api/inventory endpoint that serves a table
> displaying 50,000 products. Loading all records at once crashes the
> browser. I want to implement server-side pagination where the server
> fetches only 50 records at a time. What query parameters should the
> endpoint accept, what does the response shape look like, and how does
> the frontend know when there are more pages?"

**What I learned from the response:**
The server needs to accept `page` and `limit` as query parameters and
calculate a `skip` value of `(page - 1) * limit`. The response should
include both the data slice and pagination metadata — specifically
`totalRecords`, `totalPages`, `currentPage`, `hasNextPage`, and
`hasPrevPage` — so the frontend can render page controls and display
record counts without making a separate count request.

**How I applied it:**
I implemented the pagination logic and added input sanitisation that
the AI did not include — clamping `page` to a minimum of 1 using
`Math.max`, clamping `limit` to a maximum of 100 to prevent a client
from requesting all 50,000 records by passing `limit=99999`, and
running `Product.countDocuments` and `Product.find` in `Promise.all`
to execute them in parallel and cut response time in half.

---

## Summary — How AI Was Used in This Project

| Area | AI Role | My Contribution |
|---|---|---|
| Aggregation pipeline | Explained $group, $match, $project concepts | Wrote all three pipelines, added isCritical field, implemented Promise.all |
| Debounce hook | Explained setTimeout cleanup pattern | Added configurable delay, connected to useCallback dependency array |
| MongoDB indexing | Explained text index vs regular index trade-offs | Chose which fields to index, made write vs read trade-off decision |
| Seed script | Explained batch insertion memory pattern | Wrote the loop, progress logging, ordered:false choice |
| Pagination | Explained skip/limit pattern and response shape | Added input sanitisation, parallel count+fetch, max limit cap |

AI was used as a learning accelerator — to understand concepts I had not
implemented before. Every piece of code in this repository was written
by me, with AI serving as a technical reference, not a code generator.

---

*Anisha Madhukar — Prodesk IT Internship 2026 — Aura Engine*
