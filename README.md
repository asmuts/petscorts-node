## petscorts-node
Node.js API for Petscorts

This project holds the initial backend for Petscorts.

I plan on splitting out the location services into a separate microservice. And I'll likely build out some other services in Java.

The backend is deployed to AWS Elastic Beanstalk.

The database is MongoDB's Atlas. 

The front end is a Next.js project (petscorts-next). It's deployed to Vercel.

Authentication is done through Auth0.

Credit card processing is via Stripe.

Geolocation services are a mix between Google and some others.

City data for the front end search autocomplete is static. (I load up about 15k US cities, all of them with over a 5k population. Partial name searches are cached. . . .)

## The Node backend

The Node backend is largely divided into a controller layer and a service layer.  

Services communicate with a database or other external API, such as Stripe. Services should not use other services.

The controller layer contains business logic.  Controllers can use multiple services, but the should not use other controllers.

I'm moving the API to look more like Google's JSON guide.

The API endpoints are REST-like. I provide more options than a typical REST API.

#Note: Petscorts is a sample project. 
