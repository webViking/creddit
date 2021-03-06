import { Box, Flex, Heading, IconButton, Link, Text } from '@chakra-ui/core';
import NextLink from 'next/link';
import React, { useState } from 'react';
import { PostSnippetFragment, useVoteMutation } from '../generated/graphql';
import { EditDeletePostButtons } from './EditDeletePostButtons';

interface Post {
	post: PostSnippetFragment;
}

export const Post: React.FC<Post> = ({ post }) => {

	//type union
	const [ loading, setLoading ] = useState<'updoot-loading' | 'downdoot-loading' | 'not-loading'>('not-loading');
	
	const [ {}, vote ] = useVoteMutation();
	
	return (
		<Flex key={post.id} p={5} shadow="md" borderWidth="1px">

			<Flex direction="column" justifyContent="center" alignItems="center" mr={4}>

				<IconButton
					onClick={async () => {
						if (post.voteStatus === 1) {
							return;
						}
						setLoading('updoot-loading');
						await vote({
							postId: post.id,
							value: 1
						});
						setLoading('not-loading');
					}}
					isLoading={loading === 'updoot-loading'}
					icon="chevron-up"
					aria-label="Up vote post"
					fontSize="20px"
					variantColor={post.voteStatus === 1 ? 'green' : undefined}
				/>

				{post.points}
				
				<IconButton
					onClick={async () => {
						if (post.voteStatus === -1) {
							return;
						}
						setLoading('downdoot-loading');
						await vote({
							postId: post.id,
							value: -1
						});
						setLoading('not-loading');
					}}
					isLoading={loading === 'downdoot-loading'}
					icon="chevron-down"
					aria-label="Down vote post"
					fontSize="20px"
					variantColor={post.voteStatus === -1 ? 'red' : undefined}
				/>

			</Flex>
			
			<Box flex={1}>
				<NextLink href="/post/[id]" as={`/post/${post.id}`}>
					<Link>
						<Heading fontSize="xl">{post.title}</Heading>
					</Link>
				</NextLink>
				<Text>posted by {post.author.username}</Text>
				<Flex align="center">
					<Text flex={1} mt={4}>
						{post.textSnippet}
					</Text>
					<Box ml="auto">
						<EditDeletePostButtons id={post.id} authorId={post.authorId} />
					</Box>
				</Flex>
			</Box>
		</Flex>
	);
};
