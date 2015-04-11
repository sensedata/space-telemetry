iss-telemetry-challenge
================================================================================

explanation..

quick start - OSX
================================================================================
    
    # install node (version 0.10.32)
    $brew install node
    $npm install -g n
    $n 0.10.32
    # install project dependencies to run locally
    $cd this_repo_directory
    $npm install
    # run locally
    $npm start
    # install IBM BlueMix cli
    $brew tap pivotal/tap
    $brew install cloudfoundry-cli
    # config bluemix cli (assumes you have created app 'iss-telemetry-challenge' previously)
    $cd this_repo_directory
    $cf api https://api.ng.bluemix.net
    $cf login -u <your_username_email> -o <your_org_name> -s iss-telemetry-challenge
    # deploy
    $ cd this_repo_directory
    $cf push iss-telemetry-challenge
    $open http://iss-telemetry-challenge.mybluemix.net
    

