# react-native-ios-wpcom-oauth
A react native component that implements OAuth2 for an iOS app and passes a bearer token with global authorization scope to descendent components.

Upon starting up the application, if the user has not previously authorized the application, they will be redirected to a login and authorization screen in safari. Upon granting authorization they will be redirected back into the application, and all descendent components will have access to the bearer token to fetch information from the API.

--------------

## Installation
OAuth2 requires some configuration work in XCode. First you will need to link the react native Linking Library. You can do so by following the [instructions for manual linking here](https://facebook.github.io/react-native/docs/linking-libraries-ios.html#manual-linking). In practice I believe you only need to do steps 2 and 3 because the RCTLinking.xcodeproject file already existed in my Libraries folder.

Then you will need to register a custom URL scheme. This allows the iOS application to treat a particular URL scheme (e.g., something like `myfantasticapplication://`) as a link to launch your application, rather than opening in safari. Twitter has written [an excellent tutorial](https://dev.twitter.com/cards/mobile/url-schemes) explaining how to do this.

Now go to https://developer.wordpress.com/apps/new/, and create a new application. For the Redirect URL and Javascript Origins, you will need to enter the custom URL scheme you created previously, and importantly you must include a path (it cannot be the base URL). I suggest something like `myfantasticapplication://callback`. For the "Type" of the application, select "Native".

This component reads the OAuth settings from a config file that must live in the root of the host project. It's important that you add this file to your `.gitignore` file in the host project so you don't accidentally commit and share your application's `client_secret`. The config file should be in the format:

```js
{
	client_id: 1234,
	client_secret: 'yoursecretappkey',
	redirect_url: 'myfantasticapplication://callback',
	namespace: '@myfantasticapplication' // namespace used to store the token
}
```

## Usage
This component is written as a higher order component that passes the bearer token to descendent components in context. This is a little kludgy and will probably change in future versions. For example we might want to allow for a callback method to be passed into the component as a prop, so you can then store the token using any little data structure your little heart desires. But for now, this is how ya do it. :-)

```js
import React from 'react';
import Main from './app/components/main';
import OAuthWrapper from 'react-native-ios-wpcom-oauth';
import { AppRegistry } from 'react-native';

function MyFantasticApplication() {
	return (
		<OAuthWrapper>
			<Main />
		</OAuthWrapper >
	);
}

AppRegistry.registerComponent( 'MyFantasticApplication', () => MyFantasticApplication );
```

Then inside any descendent application, you can retrieve the bearer token from inside `render()` or [other lifecycle methods](https://facebook.github.io/react/docs/context.html#referencing-context-in-lifecycle-methods) using context, like this.

```js
import React, { Component } from 'react';
import { View } from 'react-native';

class Main extends Component {
	constructor( props ) {
		super( props );
	}

	render() {
		// accessToken is available here as this.context.accessToken
		return (
			<View />
		);
	}
}

Main.contextTypes = {
	accessToken: React.PropTypes.string,
};

module.exports = Main;
```
