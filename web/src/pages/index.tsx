import { Button, Flex, Stack } from '@chakra-ui/core';
import { withUrqlClient } from 'next-urql';
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Post } from '../components/Post';
import { usePostsQuery } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';

const Index = () => {
	
	const [ variables, setVariables ] = useState({ limit: 15, cursor: null as null | string });
	const [ { data, error, fetching } ] = usePostsQuery({
		variables: variables
	});

	if (!fetching && !data) {
		return(
		<div>
			<div>
				Query failed for some reason
			</div>
		<div>{error}</div>
		</div>);
	}
	return (
		<Layout>
			{!data && fetching ? (
				<div>loading...</div>
			) : (
				<Stack mb={4} spacing={8}>
					{data!.posts.posts.map(// by exclamation mark we are saying that {data} would never be undefined
						(p) => //!p dealing with null value
							!p ? null : ( 
								<Post post={p} key={p.id} />
							)
					)}
				</Stack>
			)}

			{data && data.posts.hasMore ? (
				<Flex>
					<Button
						onClick={() => {
							setVariables({
								limit: variables.limit,
								cursor: data.posts.posts[data.posts.posts.length - 1].createdAt //last element in the list
							});
						}}
						isLoading={fetching}
						m="auto"
						my={4}
					>
						load more
					</Button>
				</Flex>
			) : null}
		</Layout>
	);
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
