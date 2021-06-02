include .env
export

PROJECTNAME=ap-authentication-server

# Make is verbose in Linux. Make it silent.
# MAKEFLAGS += --silent

run: 
		npm start

dev: 
		./script/dev.sh 

redis: 
		docker-compose -f docker-compose.dev.yml up -d

redis-down: 
		docker-compose -f docker-compose.dev.yml down