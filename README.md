# FireFly III Connector for Israeli Financial Insututiions (working name)

This application provides a simple cli tool that enables scraping bank accounts/credit cards and inserts them to a FireFly III server via
API.

## Installation

This package is yet to be published on npm. It can be cloned and installed locally.

```bash
git clone ...
git cd israeli-firefly-iii-scraper
npm i -g .
```

There is also a docker image hosted on docker hub.

```bash
docker pull sushi30/reponame
```

## Usage

1. Get a FireFly III access token from http://my.hosted.firefly.coms/profile (OAuth tab).

2. Set the following environemnt variables:

    ```bash
    <type>_USER=
    <type>_PASSWORD=
    FIREFLY_TOKEN=
    ```

3. Use the cli to scrape and load. Example with the cli:

    ```bash
    LEUMI_USER=IM123FT
    LEUMI_PASSWORD=password123
    FIREFLY_TOKEN=eyJhdWQiOiIxMD...
    ffs scrape --start 2021-06-01 --type leumi --firefly-iii-host https://my.hosted.firefly.com
    ```

## Contributing

I do not have process set in place yet. Feel fre to open an issue or fork and contribute a pull request.

## License

[MIT](https://choosealicense.com/licenses/mit/)

## TODO

- [] organize logging
- [] set actions for lint (prettier, eslint, typescript)
- [] publish to npm
- [] versioning script
- [] pre-commit
- [] component tests
- [] examples (such as kubernetes cronjob)
