# banano-cam

this project is a no-sound camera, where any user can tip any other user.

# to begin, create a config.json file like this:

    {
      "cookieSecret": "<your secret here>",
      "hashSecret": "<your secret here>"
    }

  and override any parameters that are in the default config:

  [scripts/config.json](scripts/config.json)

# run the following command to start:

  npm start;

## to run in background, use the command:

  npm run screenstart;

## to stop, use the command:

  npm stop;

### to stop and restart, use the command:

  npm run screenrestart;
