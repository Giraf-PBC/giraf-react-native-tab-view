# Run the example

- [View it with Expo](https://expo.io/@satya164/react-native-tab-view-demos)
- Run the example locally
  - Clone the repository and `cd` to this directory
  - Run `yarn` to install the dependencies
  - Run `yarn start` to start the packager
  - Run the example app using the Expo app
    - iOS
      - workaround for `execution error: Not authorized to send Apple events to System Events.`
        - Download Expo IPA, extract, and run `xcrun simctl install booted ./Exponent-2.6.7`, per [https://github.com/expo/expo/issues/1966#issuecomment-403587836](https://github.com/expo/expo/issues/1966#issuecomment-403587836)
        - Open Simulator
        - Copy url of bundler from output of `yarn start` -- e.g. `exp://192.168.0.188:19000` -- and paste in Safari in simulator
        - Tap to open the url in Expo app
