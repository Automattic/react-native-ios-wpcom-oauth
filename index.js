import React, { Component } from 'react';
import { Linking } from 'react-native';
import { parse, stringify } from 'qs';
import { AsyncStorage } from 'react-native';
import {
	client_id,
	client_secret,
	redirect_uri,
	namespace,
} from '../../config.js';

async function getStorage( itemKey ) {
	try {
		const value = await AsyncStorage.getItem( `${ namespace }:${ itemKey }` );
		return value;
	} catch ( e ) {
		throw new Error( `storage failed to get item: ${ e }` );
	}
}

async function setStorage( itemKey, value ) {
	try {
		const stringValue = 'string' === typeof value ? value : JSON.stringify( value );
		await AsyncStorage.setItem( `${ namespace }:${ itemKey }`, stringValue );
	} catch ( e ) {
		throw new Error( `storage failed to set item: ${ e }` );
	}
}

const wpcomOAuth = () => {
	const { client_id } = config;
	const queryString = stringify( {
		client_id,
		redirect_uri,
		response_type: 'code',
		scope: 'global',
	} );
	const oauthURL = `https://public-api.wordpress.com/oauth2/authorize?${ queryString }`;
	Linking.openURL( oauthURL ).catch( err => console.error( 'An error occurred', err ) );
};

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
		return getStorage( 'accessToken' )
		.then( accessToken => {
			if ( accessToken ) {
				this.setState( { accessToken } );
				return;
			}
			Linking.addEventListener( 'url', this.handleOpenURL.bind( this ) );
			wpcomOAuth();
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
		const storeToken = function storeToken( accessToken ) {
			this.setState( { accessToken } );
			setStorage( 'accessToken', accessToken );
		}.bind( this );

		Linking.removeEventListener( 'url', this.handleOpenURL.bind( this ) );
		const queryString = event.url.split( '?' )[ 1 ];
		const { code } = parse( queryString );
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
};

OAuthWrapper.childContextTypes = {
	accessToken: React.PropTypes.string,
};

export default OAuthWrapper;
