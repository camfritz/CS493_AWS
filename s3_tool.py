import boto3
import sys
import os
import ntpath

###Access Temporary Credentials###

print boto3.__version__

sts_client = boto3.client('sts')

print sts_client.get_caller_identity()

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


###############################################################

###Helper function to get only file name from path###
def path_leaf(path):
	head, tail = ntpath.split(path)
	return tail or ntpath.basename(head)

#Get the file/folder upload path

if(len(sys.argv) <= 1):
	upload_path = raw_input('Enter a file or file path for upload:')
else:
	upload_path = sys.argv[1]

#Determine if path is a file or folder and if it exists
if(os.path.isfile(upload_path)):
	#if path is a file, upload to s3 with option to rename file
	upload_name = raw_input('Enter upload name of file (Leave blank to keep file name when uploading)')
	upload_target = path_leaf(upload_path)

	if(upload_name == ''):
		s3.meta.client.upload_file(str(upload_path), 'cf-privatebucket01', str(upload_target))
	else:
		s3.meta.client.upload_file(str(upload_path), 'cf-privatebucket01', str(upload_name))

elif(os.path.isdir(upload_path)):
	print ('Path is a folder')
else:
	print('invalid path or file does not exist')

###Test Code###

# for bucket in s3.buckets.all():
# 	print(bucket.name)

###############
