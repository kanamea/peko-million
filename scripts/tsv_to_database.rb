require 'csv'
require 'open-uri'
require 'rmagick'

def tsv_to_database(tsv_file)
    # iterate through tsv
    database = ""
    loader = ""

    id = 1
    anon_cnt = 1

    manual_anon_id = []

    if !Dir.exist? 'img'
        Dir.mkdir 'img'
    end

    CSV.foreach(tsv_file, headers: :first_row, internal_encoding: 'UTF-8') do |line|
        timestamp, profile_pic, username, region, fan_art, twitter, message = line.map { |x| x[1]}

        case (username)
        when /^Anonymous\sNousagi\s#/
            manual_anon_id.push(username.squeeze(' ')["Anonymous Nousagi #".length..-1])
        end
    end

    CSV.foreach(tsv_file, headers: :first_row, internal_encoding: 'UTF-8') do |line|
        pp "Parsing ##{id}..."
        timestamp, profile_pic, username, region, fan_art, twitter, message, alt_message = line.map { |x| x[1]}

        # try to grab art from link
        has_avatar = if Dir.glob("../public/#{id}_ava.*").length > 0 then 0 else -1 end
        ava_ext = if Dir.glob("../public/#{id}_ava.*").length > 0 then "." + Dir.glob("../public/#{id}_ava.*")[0].split(".")[-1] else nil end
        frame_count_ava = 0
        animation_speed_ava = 0
        ava_dled = false

        if profile_pic != nil && profile_pic != ""
            if has_avatar == -1
                begin
                    URI.open(profile_pic) do |f|
                        # check if the value is image
                        if !f.content_type.include?("image")
                            has_avatar = -1
                        else
                            ava_ext = retrieve_extention(f.content_type)

                            File.open("./img/#{id}_ava#{ava_ext}", 'wb') do |fo|
                                fo.write f.read
                                has_avatar = 0
                                ava_dled = true
                            end
                        end
                    end
                rescue
                    has_avatar = -1
                end
            end
        else
            has_avatar = 1
        end

        # if it's a gif, get frame count
        if ava_ext == ".gif"
            i = Magick::ImageList.new(if ava_dled then "./img/#{id}_ava#{ava_ext}" else "../public/#{id}_ava.gif" end)
            frame_count_ava = i.length
            animation_speed_ava = (1 / (i.delay / i.ticks_per_second.to_f)) / 60
        end

        has_fan_art = if Dir.glob("../public/#{id}_art.*").length > 0 then 0 else -1 end
        art_ext = if Dir.glob("../public/#{id}_art.*").length > 0 then "." + Dir.glob("../public/#{id}_art.*")[0].split(".")[-1] else nil end
        frame_count_art = 0
        animation_speed_art = 0
        art_dled = false

        if fan_art != nil && fan_art != ""
            if has_fan_art == -1
                begin
                    URI.open(fan_art) do |f|
                        # check if the value is image
                        if !f.content_type.include?("image")
                            has_fan_art = -1
                        else
                            art_ext = retrieve_extention(f.content_type)

                            File.open("./img/#{id}_art#{art_ext}", 'wb') do |fo|
                                fo.write f.read
                                has_fan_art = 0
                                art_dled
                            end
                        end
                    end
                rescue
                    has_fan_art = -1
                end
            end
        else
            has_fan_art = 1
        end

        # if it's a gif, get frame count
        if art_ext == ".gif"
            i = Magick::ImageList.new(if art_dled then "./img/#{id}_art#{art_ext}" else "../public/#{id}_art.gif" end)
            frame_count_art = i.length
            animation_speed_art = (1 / (i.delay / i.ticks_per_second.to_f)) / 60
        end

        has_twitter = 0
        twitter_link = nil

        if twitter != nil && twitter != ""
            case twitter
            when /^https/
                twitter_link = twitter
            when /^@/
                twitter_link = "https://twitter.com/" + twitter[1..-1]
            else
                twitter_link = "https://twitter.com/" + twitter
            end

            begin
                URI.open(twitter_link) do |f|
                    has_twitter = 0
                end
            rescue
                has_twitter = -1
            end
        else
            has_twitter = 1
        end

        database += "{\n"
        database += "\tid: #{id},\n"
        database += "\tname: \"#{if username == nil then "Anonymous Nousagi ##{anon_cnt.to_s.rjust(3, "0")}" else username.gsub("\"", "\\\"").gsub("\n", "\\n") end}\",\n"
        database += "\tmessage: \"#{message.gsub("\"", "\\\"").gsub("\n", "\\n").gsub("\r", "")}\",\n"
        database += "\talt_message: #{if alt_message == nil || alt_message == "*" then "null" else "\"#{alt_message.gsub("\"", "\\\"").gsub("\n", "\\n").gsub("\r", "")}\"" end},\n"
        database += "\thas_twitter: #{has_twitter},\n"
        database += "\ttwitter: \"#{twitter_link}\",\n"
        database += "\tread: false,\n"
        database += "\tregion: \"#{if region == nil then "None" else region end}\",\n"
        database += "\thas_avatar: #{has_avatar},\n"
        database += "\thas_fan_art: #{has_fan_art},\n"
        database += "\tavatar: #{if has_avatar == 0 then "\"./profile/#{id}_ava#{if ava_ext == ".webp" then ".png" else ava_ext end}\"" else "null" end},\n"
        database += "\tfan_art: #{if has_fan_art == 0 then "\"./profile/#{id}_art#{if art_ext == ".webp" then ".png" else art_ext end}\"" else "null" end},\n"
        database += "\thas_gif_avatar: #{ava_ext == ".gif"},\n"
        database += "\thas_gif_fan_art: #{art_ext == ".gif"},\n"
        database += "\tava_frame_count: #{frame_count_ava},\n"
        database += "\tart_frame_count: #{frame_count_art},\n"
        database += "\tava_animation_speed: #{animation_speed_ava},\n"
        database += "\tart_animation_speed: #{animation_speed_art},\n"
        database += "},\n"

        if has_avatar == 0 && ava_ext != ".gif"
            loader += "const i#{id}_ava = require('./profile/#{id}_ava#{if ava_ext == ".webp" then ".png" else ava_ext end}')\n"
        elsif has_avatar == 0
            loader += "const i#{id}_ava_png = require('./profile/#{id}_ava.png')\n"
            loader += "const i#{id}_ava_json = require('./profile/#{id}_ava.json')\n"
        end

        if has_fan_art == 0 && art_ext != ".gif"
            loader += "const i#{id}_art = require('./profile/#{id}_art#{if art_ext == ".webp" then ".png" else art_ext end}')\n"
        elsif has_fan_art == 0
            loader += "const i#{id}_art_png = require('./profile/#{id}_art.png')\n"
            loader += "const i#{id}_art_json = require('./profile/#{id}_art.json')\n"
        end

        id += 1
        if username == nil
            anon_cnt += 1

            while manual_anon_id.include?(anon_cnt.to_s)
                anon_cnt += 1
            end
        end
    end

    # write object
    File.open("database.js", 'w:UTF-8') do |f|
        f.write "class Database {\n\tstatic async get_messages(options) {\n\t\treturn new Promise((resolve, reject) => {\n\t\t\t// dummy data to fill for now\n"
        f.write "\t\t\tlet arr = [\n" + database[0..-1].split("\n").map { |line| "\t" * 4 + line}.join("\n") + "\n"
        f.write "\t\t\t]\n\n\t\t\tDatabase.shuffle(arr)\n\n\t\t\tresolve(arr)\n\t\t});\n\t}\n\n\tstatic shuffle(arr) {\n\t\tfor (var i = arr.length - 1; i > 0; i--) {\n\t\t\tvar j = Math.floor(Math.random() * (i + 1));\n\t\t\tvar temp = arr[i];\n\t\t\tarr[i] = arr[j];\n\t\t\tarr[j] = temp;\n\t\t}\n\t}\n}\n\nexport default Database;"
    end

    File.open("loader.js", 'w:UTF-8') do |f|
        f.write loader

        f.write "\n// load all the assets that will be used here\nconst pekomon_hl = require('./img/pekomon_hl.json')\nconst pkmnjson = require('./img/pekomon.json')\nconst pekora = require('./img/pekora.json')\nconst pekomon_hl2 = require('./img/pekomon_hl.png')\nconst pekomon2 = require('./img/pekomon.png')\nconst pekora2 = require('./img/pekora.png')\n"
        f.write "\n// region\nconst africa = require('./profile/Africa.png')\nconst central_america = require('./profile/Central America.png')\nconst central_asia = require('./profile/Central Asia.png')\nconst east_asia = require('./profile/East Asia.png')\nconst europe_north_asia = require('./profile/Europe & North Asia.png')\nconst none = require('./profile/None.png')\nconst north_america = require('./profile/North America.png')\nconst oceania = require('./profile/Oceania.png')\nconst south_america = require('./profile/South America.png')\nconst south_asia = require('./profile/South Asia.png')\nconst south_east_asia = require('./profile/South East Asia.png')\nconst west_asia = require('./profile/West Asia.png')\n"
        f.write "\n// icons\nconst twitter = require('./profile/twitter.png')\nconst translate_grey = require('./profile/translate_grey.png')\nconst translate = require('./profile/translate.png')\nconst default_ava = require('./profile/default_ava.png')"
        f.write "\n// main icon\nconst japanese = require('./img/japanese.png')\nconst english = require('./img/english.png')\nconst sound_off = require('./img/sound_off.png')\nconst sound_on = require('./img/sound_on.png')"
        f.write "\n// others\nconst bgm = require('./bgm/tanukichi.mp3')\n"
    end
end

def retrieve_extention(content_type)
    case content_type.split('/')[1]
    when 'vnd.microsoft.icon'
        return '.ico'
    when 'svg+xml'
        return '.svg'
    else
        return '.' + content_type.split('/')[1]
    end
end

tsv_to_database("data.csv")