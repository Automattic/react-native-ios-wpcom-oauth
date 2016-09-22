import React, { Component } from 'react';
import { AsyncStorage, Linking } from 'react-native';
import { parse, stringify } from 'qs';

class OAuthWrapper extends Component {
	state = {
		accessToken: null,
	}
	getChildContext() {
		return {
			accessToken: this.state ? this.state.accessToken : null,
		};
	}
	componentDidMount() {
		return AsyncStorage.getItem( '@ReactNativeIOSWpcomOauth:accessToken' )
		.then( accessToken => {
			if ( accessToken ) {
				this.setState( { accessToken } );
				return;
			}
			Linking.addEventListener( 'url', this.handleOpenURL.bind( this ) );
			const { client_id, redirect_uri } = this.props;
			const queryString = stringify( {
				client_id,
				redirect_uri,
				response_type: 'code',
				scope: 'global',
			} );
			console.log( queryString );
			const oauthURL = `https://public-api.wordpress.com/oauth2/authorize?${ queryString }`;
			Linking.openURL( oauthURL ).catch( err => console.error( 'An error occurred', err ) );
		} )
		.catch( ( error ) => {
			throw new Error( `Unable to retrieve accessToken from storage: ${ error }` );
		} )
		.done();
	}
	componentWillUnmount() {
		Linking.removeEventListener( 'url', this.handleOpenURL.bind( this ) );
	}
	handleOpenURL( event ) {
		const {
			client_id,
			client_secret,
			redirect_uri,
		} = this.props;
		const storeToken = function storeToken( accessToken ) {
			this.setState( { accessToken } );
			AsyncStorage.setItem( '@ReactNativeIOSWpcomOauth:accessToken', accessToken );
		}.bind( this );

		Linking.removeEventListener( 'url', this.handleOpenURL.bind( this ) );
		const queryString = event.url.split( '?' )[ 1 ];
		const { code } = parse( queryString );
		console.log( stringify( {
			client_id,
			client_secret,
			redirect_uri,
			code,
			grant_type: 'authorization_code',
		} ) );
		return fetch( 'https://public-api.wordpress.com/oauth2/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: stringify( {
				client_id,
				client_secret,
				redirect_uri,
				code,
				grant_type: 'authorization_code',
			} ),
		} )
		.then( ( response ) => response.json() )
		.then( ( responseJson ) => {
			const { access_token } = responseJson;
			storeToken( access_token );
			return access_token;
		} )
		.catch( ( error ) => {
			console.log( 'why so error?' );
			console.error( error );
		} )
		.done();
	}
	render() {
		return React.cloneElement( this.props.children, this.state );
	}
}

OAuthWrapper.propTypes = {
	children: React.PropTypes.object.isRequired,
	client_id: React.PropTypes.string.isRequired,
	client_secret: React.PropTypes.string.isRequired,
	redirect_uri: React.PropTypes.string.isRequired,
};

OAuthWrapper.childContextTypes = {
	accessToken: React.PropTypes.string,
};

export default OAuthWrapper;
