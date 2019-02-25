import boto3
import sys
import os
import ntpath

###Access Temporary Credentials###

print 'Using Boto3 Version ' + boto3.__version__

sts_client = boto3.client('sts')

print 'with following credentials: \n' + str(sts_client.get_caller_identity()) + '\n\n'

assumed_role_object = sts_client.assume_role(RoleArn="arn:aws:iam::212162526483:role/S3FullAccessRole",
	RoleSessionName="Session1"
)

credentials = assumed_role_object['Credentials']

s3 = boto3.resource(
    's3',
    aws_access_key_id=credentials['AccessKeyId'],
    aws_secret_access_key=credentials['SecretAccessKey'],
    aws_session_token=credentials['SessionToken'],
)

ddb = boto3.resource(
	'dynamodb',
	aws_access_key_id=credentials['AccessKeyId'],
	aws_secret_access_key=credentials['SecretAccessKey'],
	aws_session_token=credentials['SessionToken'],
	)

table = ddb.Table('music')

###############################################################

###Helper function to get only file name from path###
def path_leaf(path):
	head, tail = os.path.split(path)
	return tail or os.path.basename(head)

def path_head(path):
	head, tail = os.path.split(path)
	return head

#Get the file/folder upload path

if(len(sys.argv) <= 1):
	upload_path = raw_input('Enter a file or file path for upload:')
elif(len(sys.argv) == 2):
	upload_path = sys.argv[1]
	upload_name = ''
elif(len(sys.argv) == 3):
	upload_path = sys.argv[1]
	upload_name = sys.argv[2]
else:
	print 'Usage: python s3_tool.py [local_path] [upload_name]'
	exit(1)

#Determine if path is a file or folder and if it exists
if(os.path.isfile(upload_path)):
	#if path is a file, upload to s3 with option to rename file/storage path
	if(len(sys.argv) <= 1):
		upload_name = raw_input('Enter upload name of file. (blank = original)')
	upload_target = path_leaf(upload_path)

	artist_name = raw_input('Enter name of artist')
	album_name = raw_input('Enter name of album')
	genre_name = raw_input('Enter name of genre')

	if(upload_name == ''):
		s3.Object('cf-privatebucket01', 'songs/' + str(upload_target)).upload_file(Filename=str(upload_path))

		table.put_item(
			Item={
				'genre' : genre_name,
				'artist_album_song' : artist_name + '#' + album_name + '#' + upload_target[:-4],
				'artist' : artist_name
			})
	else:
		s3.Object('cf-privatebucket01', 'songs/' + str(upload_name)).upload_file(Filename=str(upload_path))

		table.put_item(
			Item={
				'genre' : genre_name,
				'artist_album_song' : artist_name + '#' + album_name + '#' + upload_name[:-4],
				'artist' : artist_name
			})


elif(os.path.isdir(upload_path)):
	artist_name = ''
	#if path is a folder, upload all objects in folder to s3 with option to rename folder and/or storage path
	if(len(sys.argv) <= 1):
		upload_name = raw_input('Enter upload name of album/artist. (blank = original)')

	if(upload_name == ''):
		artist_name = raw_input('Enter name of artist')
	genre_name = raw_input('Enter name of genre')

	rootTrigger = True;

	for root, dirs, files in os.walk(upload_path):
		if(rootTrigger == True):
			firstRootName = path_leaf(root)
			firstHeadName = path_head(root)
			rootTrigger = False
		for file in files:
			if(upload_name == ''):
				#s3.meta.client.upload_file(os.path.join(root, file), 'cf-privatebucket01', os.path.join(root[len(firstHeadName) + 1:], file))
				string = (root[len(firstHeadName) + 1:]).split('/')
				s3.Object('cf-privatebucket01', os.path.join(root[len(firstHeadName) + 1:], file)).upload_file(Filename=os.path.join(root, file))

				table.put_item(
					Item={
						'genre' : genre_name,
						'artist_album_song' : artist_name + '#' + string[len(string) - 1] + '#' + file[:-4],
						'artist' : artist_name
					})

			else:
				#s3.meta.client.upload_file(os.path.join(root, file), 'cf-privatebucket01', str(upload_name + '/' + os.path.join(root[len(firstHeadName) + len(firstRootName) + 2:], file)))
				s3.Object('cf-privatebucket01', str(upload_name + '/' + os.path.join(root[len(firstHeadName) + len(firstRootName) + 2:], file))).upload_file(Filename=os.path.join(root, file))

				string = (root[len(firstHeadName) + 1:]).split('/')

				if(len(string) >= 2):
					table.put_item(
						Item={
						'genre' : genre_name,
						'artist_album_song' : upload_name + '#' + string[len(string) - 1] + '#' + file[:-4],
						'artist' : upload_name
						})
				else:
					if(artist_name == ''):
						artist_name = raw_input('Enter name of artist')

					table.put_item(
							Item={
								'genre' : genre_name,
								'artist_album_song' : artist_name + '#' + upload_name + '#' + file[:-4],
								'artist' : artist_name
							}
						)
else:
	print('invalid path or file does not exist')

###Test Code###

# for bucket in s3.buckets.all():
# 	print(bucket.name)

		# for root, dirs, files in os.walk(upload_path):
		# 	for name in files:
		# 		if(os.path.isfile(os.path.join(root, name))):
		# 			print os.path.join(name)

			# if(upload_name == ''):
	# 	for item in os.listdir(upload_path):
	# 		if(os.path.isfile(os.path.join(upload_path, item))):
	# 			print path_leaf(upload_path) + '/' + item

				# print '\n###ROOT###'
			# print root
			# print '####DIRS###'
			# print dirs
			# print '###FILES###'
			# print files


	# for root, dirs, files in os.walk(upload_path):
	# 	if(rootTrigger == True):
	# 		firstRootName = path_leaf(root)
	# 		rootTrigger = False
	# 	for file in files:
	# 		if(upload_name == ''):
	# 			s3.meta.client.upload_file(str(os.path.join(root, file)), 'cf-privatebucket01', firstRootName + '/' + file)
	# 		else:
	# 			s3.meta.client.upload_file(str(os.path.join(root, file)), 'cf-privatebucket01', upload_name + '/' + file)

###############
